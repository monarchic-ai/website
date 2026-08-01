{
  description = "Monarchic public website";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
          pname = "monarchic-website";
          version = packageJson.version;
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit pname version;
            src = ./.;
            hash = "sha256-tIajqyVK5PK2yKx6DyQER1IAfISVlDLcdRNkmO3+7nk=";
            fetcherVersion = 3;
          };
          website = pkgs.stdenvNoCC.mkDerivation {
            inherit pname version pnpmDeps;
            src = ./.;

            nativeBuildInputs = [
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            npm_config_manage_package_manager_versions = "false";

            buildPhase = ''
              runHook preBuild
              pnpm run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p "$out"
              cp -R dist "$out/"
              runHook postInstall
            '';

            meta = {
              description = "Monarchic public website";
              homepage = "https://github.com/monarchic-meta/website";
            };
          };
        in
        {
          default = website;
          monarchic-website = website;
        });

      checks = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
          pname = "monarchic-website";
          version = packageJson.version;
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit pname version;
            src = ./.;
            hash = "sha256-tIajqyVK5PK2yKx6DyQER1IAfISVlDLcdRNkmO3+7nk=";
            fetcherVersion = 3;
          };
          mkWebsiteCheck = name: command: pkgs.stdenvNoCC.mkDerivation {
            inherit pname version pnpmDeps;
            name = "${pname}-${name}-${version}";
            src = ./.;

            nativeBuildInputs = [
              pkgs.chromium
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.pnpmConfigHook
              pkgs.util-linux
            ];

            npm_config_manage_package_manager_versions = "false";
            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";

            dontBuild = true;
            installPhase = ''
              runHook preInstall
              export TMPDIR="$(mktemp -d)"
              export XDG_CACHE_HOME="$(mktemp -d)"
              export XDG_CONFIG_HOME="$(mktemp -d)"
              export XDG_RUNTIME_DIR="$(mktemp -d)"
              ${command}
              mkdir -p "$out"
              touch "$out/passed"
              runHook postInstall
            '';
          };
        in
        {
          package = self.packages.${system}.monarchic-website;
          diagnostics = mkWebsiteCheck "diagnostics" ''
            pnpm run check
          '';
          contracts = mkWebsiteCheck "contracts" ''
            pnpm run check:webcomposer
            pnpm run check:catalog-artifact
            pnpm run check:shared-catalog
            pnpm run check:release-workflow
            pnpm run check:social-preview
          '';
          smoke = mkWebsiteCheck "smoke" ''
            flock --wait 600 /tmp/monarchic-frontend-browser-smoke.lock pnpm run smoke:local:static
          '';
        });

      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.chromium
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.util-linux
            ];

            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
          };
        });
    };
}
