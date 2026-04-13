{
  description = "huandao-cockpit dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    android-nixpkgs = {
      url = "github:tadfisher/android-nixpkgs/main";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, android-nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      ndkVersion = "27.1.12297006";
      cmakeVersion = "3.22.1";

      androidSdk = android-nixpkgs.sdk.${system} (sdkPkgs: with sdkPkgs; [
        build-tools-35-0-0
        build-tools-36-0-0
        cmake-3-22-1
        cmdline-tools-latest
        ndk-27-1-12297006
        platform-tools
        platforms-android-35
        platforms-android-36
        emulator
      ]);
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.jdk17
          androidSdk
          pkgs.nodejs_22
          pkgs.pnpm
          pkgs.nspr
          pkgs.nss
        ];

        shellHook = ''
          export JAVA_HOME="${pkgs.jdk17.home}"
          export ANDROID_HOME="${androidSdk}/share/android-sdk"
          export ANDROID_SDK_ROOT="$ANDROID_HOME"
          export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/${ndkVersion}"
          export CMAKE_VERSION="${cmakeVersion}"
          export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
          export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.nspr pkgs.nss ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
        '';
      };
    };
}
