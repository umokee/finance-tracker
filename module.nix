{
  config,
  pkgs,
  lib,
  helpers,
  ...
}:

let
  enable = helpers.hasIn "services" "finance-tracker";

  gitRepo = "https://github.com/user/finance-tracker.git";
  gitBranch = "main";

  domain = "finance.umkcloud.xyz";
  publicPort = 8882;
  backendPort = 8001;
  backendHost = "127.0.0.1";

  # IP whitelist
  allowedIPs = [
    "127.0.0.1"
    "178.218.98.184"
  ];

  projectPath = "/var/lib/finance-tracker";
  secretsDir = "/var/lib/finance-tracker-secrets";
  logDir = "/var/log/finance-tracker";
  frontendBuildDir = "${projectPath}/frontend/dist";

  user = "finance-tracker";
  group = "finance-tracker";

  nodeDeps = with pkgs; [
    nodejs
    nodePackages.npm
  ];
in
{
  config = lib.mkIf enable {
    users.users.${user} = {
      isSystemUser = true;
      group = group;
      description = "Finance Tracker service user";
      home = projectPath;
    };
    users.groups.${group} = { };

    networking.firewall.allowedTCPPorts = [ publicPort ];

    systemd.tmpfiles.rules = [
      "d ${projectPath} 0755 ${user} ${group} -"
      "d ${secretsDir} 0700 ${user} ${group} -"
      "d ${logDir} 0750 ${user} ${group} -"
      "f ${logDir}/app.log 0640 ${user} ${group} -"
    ];

    sops.secrets."finance-tracker-api" = {
      owner = user;
    };

    sops.templates."finance-tracker-env" = {
      content = ''
        FINANCE_API_KEY=${config.sops.placeholder."finance-tracker-api"}
      '';
      owner = user;
      group = group;
    };

    systemd.services.finance-tracker-git-sync = {
      description = "Sync Finance Tracker from Git";
      wantedBy = [ "multi-user.target" ];
      after = [
        "systemd-tmpfiles-setup.service"
        "network-online.target"
      ];
      wants = [ "network-online.target" ];
      requires = [ "systemd-tmpfiles-setup.service" ];
      path = [
        pkgs.git
        pkgs.coreutils
        pkgs.bash
      ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = user;
        Group = group;
      };

      script = ''
        set -e

        mkdir -p ${projectPath}
        chmod 755 ${projectPath}

        if [ -d ${projectPath}/.git ]; then
          cd ${projectPath}
          ${pkgs.git}/bin/git fetch origin
          ${pkgs.git}/bin/git checkout ${gitBranch}
          ${pkgs.git}/bin/git reset --hard origin/${gitBranch}
          ${pkgs.git}/bin/git pull origin ${gitBranch}
        else
          rm -rf ${projectPath}/*
          rm -rf ${projectPath}/.* 2>/dev/null || true
          cd ${projectPath}
          ${pkgs.git}/bin/git clone -b ${gitBranch} ${gitRepo} .
        fi

        chmod -R u+w ${projectPath}
        echo "Git sync completed successfully"
      '';
    };

    systemd.services.finance-tracker-frontend-build = {
      description = "Build Finance Tracker Frontend";
      after = [ "finance-tracker-git-sync.service" ];
      requires = [ "finance-tracker-git-sync.service" ];
      wantedBy = [ "multi-user.target" ];
      path = nodeDeps ++ [
        pkgs.coreutils
        pkgs.bash
      ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = user;
        Group = group;
        WorkingDirectory = "${projectPath}/frontend";
      };

      script = ''
        set -e

        if [ ! -d ${projectPath}/frontend ]; then
          echo "Error: Frontend directory does not exist"
          exit 1
        fi

        cd ${projectPath}/frontend

        echo "Installing frontend dependencies..."
        ${pkgs.nodejs}/bin/npm install

        echo "Building frontend..."
        ${pkgs.nodejs}/bin/npm run build

        echo "Frontend build completed successfully"
        ls -la dist/
      '';
    };

    systemd.services.finance-tracker-backend = {
      description = "Finance Tracker API Backend";
      after = [
        "finance-tracker-git-sync.service"
        "network-online.target"
      ];
      wants = [ "network-online.target" ];
      requires = [
        "finance-tracker-git-sync.service"
      ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        FINANCE_TRACKER_LOG_DIR = logDir;
        FINANCE_TRACKER_LOG_FILE = "app.log";
        PYTHONPATH = projectPath;
      };

      path = [
        pkgs.python312
        pkgs.gcc
        pkgs.stdenv.cc
        pkgs.zlib
      ];

      serviceConfig = {
        Type = "simple";
        User = user;
        Group = group;
        WorkingDirectory = projectPath;
        TimeoutStartSec = "infinity";

        EnvironmentFile = config.sops.templates."finance-tracker-env".path;
        ExecStart = "${projectPath}/venv/bin/uvicorn backend.app.main:app --host ${backendHost} --port ${toString backendPort}";
        Restart = "always";
        RestartSec = "10";

        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectSystem = "full";
        ProtectHome = true;
        ReadWritePaths = [
          logDir
          projectPath
        ];

        StandardOutput = "journal";
        StandardError = "journal";
        SyslogIdentifier = "finance-tracker-backend";
      };

      preStart = ''
        if [ ! -d ${projectPath} ]; then
          echo "Error: ${projectPath} does not exist"
          exit 1
        fi

        if [ ! -d ${projectPath}/venv ]; then
          echo "Creating virtualenv..."
          ${pkgs.python312}/bin/python -m venv ${projectPath}/venv
        fi

        echo "Installing dependencies from requirements.txt..."
        ${projectPath}/venv/bin/pip install --upgrade pip
        ${projectPath}/venv/bin/pip install -r ${projectPath}/backend/requirements.txt
      '';
    };

    systemd.services.finance-tracker-update = {
      description = "Update Finance Tracker";

      path = [
        pkgs.coreutils
        pkgs.systemd
      ];

      serviceConfig = {
        Type = "oneshot";
      };

      script = ''
        set -e
        echo "=== Updating Finance Tracker ==="

        echo "[1/7] Stopping backend..."
        ${pkgs.systemd}/bin/systemctl stop finance-tracker-backend

        echo "[2/7] Updating code from Git..."
        ${pkgs.systemd}/bin/systemctl restart finance-tracker-git-sync
        sleep 2

        echo "[3/7] Recreating Python environment..."
        if [ -d ${projectPath}/venv ]; then
          echo "Removing old venv..."
          rm -rf ${projectPath}/venv
        fi

        echo "[4/7] Rebuilding frontend..."
        ${pkgs.systemd}/bin/systemctl restart finance-tracker-frontend-build
        sleep 3

        echo "[5/7] Starting backend..."
        ${pkgs.systemd}/bin/systemctl start finance-tracker-backend
        sleep 5

        echo "[6/7] Checking backend status..."
        if ! ${pkgs.systemd}/bin/systemctl is-active --quiet finance-tracker-backend; then
          echo "ERROR: Backend failed to start!"
          ${pkgs.systemd}/bin/systemctl status finance-tracker-backend --no-pager || true
          exit 1
        fi

        echo "[7/7] Reloading reverse proxy..."
        ${pkgs.systemd}/bin/systemctl reload nginx

        echo "Done!"
        echo ""
      '';
    };

    services.nginx = {
      enable = lib.mkDefault true;

      recommendedGzipSettings = lib.mkDefault true;
      recommendedOptimisation = lib.mkDefault true;
      recommendedProxySettings = lib.mkDefault true;

      proxyTimeout = "60s";

      virtualHosts."${domain}" = {
        listen = [
          {
            addr = "0.0.0.0";
            port = publicPort;
          }
        ];

        extraConfig = ''
          ${lib.concatMapStrings (ip: "allow ${ip};\n          ") allowedIPs}
          deny all;
        '';

        locations."/api/" = {
          proxyPass = "http://${backendHost}:${toString backendPort}";
          extraConfig = ''
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
          '';
        };

        locations."/" = {
          root = frontendBuildDir;
          tryFiles = "$uri $uri/ /index.html";
        };

        locations."~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$" = {
          root = frontendBuildDir;
          extraConfig = ''
            add_header Cache-Control "public, max-age=31536000, immutable";
            access_log off;
          '';
        };
      };
    };
  };
}
