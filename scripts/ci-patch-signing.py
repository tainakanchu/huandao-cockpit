#!/usr/bin/env python3
"""
CI用: expo prebuild で生成された app/build.gradle に
release 署名設定を注入するスクリプト。

環境変数から署名情報を読み取り、gradle.properties と
build.gradle を書き換える。keystore ファイルは事前に
android/app/release.keystore に配置済みであること。
"""
import os

# gradle.properties に署名情報を追加
props_path = "android/gradle.properties"
with open(props_path, "a") as f:
    f.write("\n# Release signing (injected by CI)\n")
    f.write(f"RELEASE_STORE_FILE=release.keystore\n")
    f.write(f"RELEASE_STORE_PASSWORD={os.environ['STORE_PASSWORD']}\n")
    f.write(f"RELEASE_KEY_ALIAS={os.environ['KEY_ALIAS']}\n")
    f.write(f"RELEASE_KEY_PASSWORD={os.environ['KEY_PASSWORD']}\n")

# build.gradle に release signingConfig を追加
gradle_path = "android/app/build.gradle"
with open(gradle_path) as f:
    content = f.read()

# signingConfigs ブロックに release を追加
release_config = (
    "        release {\n"
    "            if (project.hasProperty('RELEASE_STORE_FILE')) {\n"
    "                storeFile file(RELEASE_STORE_FILE)\n"
    "                storePassword RELEASE_STORE_PASSWORD\n"
    "                keyAlias RELEASE_KEY_ALIAS\n"
    "                keyPassword RELEASE_KEY_PASSWORD\n"
    "            }\n"
    "        }\n"
)

# debug の閉じ括弧の後に release を挿入
old = "            storeFile file('debug.keystore')\n            storePassword 'android'\n            keyAlias 'androiddebugkey'\n            keyPassword 'android'\n        }"
new = old + "\n" + release_config
content = content.replace(old, new, 1)

# release buildType で release signingConfig を使う
content = content.replace(
    "signingConfig signingConfigs.debug\n            ",
    "signingConfig signingConfigs.debug\n            ",
    1,  # skip debug buildType (first occurrence)
)

# release buildType の signingConfig を変更
# "release {" ブロック内の signingConfig を差し替え
lines = content.split("\n")
in_release_block = False
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped == "release {" and "buildTypes" in "\n".join(lines[max(0, i-5):i]):
        in_release_block = True
    if in_release_block and "signingConfig signingConfigs.debug" in line:
        lines[i] = line.replace(
            "signingConfig signingConfigs.debug",
            "signingConfig project.hasProperty('RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
        )
        in_release_block = False
        break

content = "\n".join(lines)

with open(gradle_path, "w") as f:
    f.write(content)

print("Release signing config patched successfully")
