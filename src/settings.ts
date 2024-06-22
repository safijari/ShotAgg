import { ServerAPI } from "decky-frontend-lib";

type SettingsStruct = {
  copy_most_recent: boolean;
  folder_per_game: boolean;
}

type ValueOf<T> = T[keyof T];

export class Settings {
  private static serverAPI: ServerAPI;
  static get server() {
    return this.serverAPI;
  }

  static settingsData: SettingsStruct = {
    copy_most_recent: true,
    folder_per_game: true
  }

  static get data() {
    return this.settingsData;
  }

  static async setSetting(key: keyof SettingsStruct, value: ValueOf<SettingsStruct>) {
    this.settingsData[key] = value;
    await this.server?.callPluginMethod<{ key: string, value: ValueOf<SettingsStruct> }, void>("set_setting", { key, value });
  }

  static async init(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;
    const backendSettingsResponse = await this.server?.callPluginMethod<{}, SettingsStruct>("get_settings", {});
    if (backendSettingsResponse.success) {
      this.settingsData = { ...this.settingsData, ...backendSettingsResponse.result };
    } else {
      console.log(backendSettingsResponse)
    }
  }
}

