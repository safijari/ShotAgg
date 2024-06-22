import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  staticClasses,
  ToggleField,
} from "decky-frontend-lib";
import { VFC, useState } from "react";
import { HiOutlineCamera } from "react-icons/hi";
import { Settings } from "./settings";

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [buttonEnabled, setButtonEnabled] = useState<boolean>(true);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [copyMostRecent, setCopyMostRecent] = useState<boolean>(Settings.data.copy_most_recent);
  const [folderPerGame, setFolderPerGame] = useState<boolean>(Settings.data.folder_per_game);

  const onClickAggragateButton = async () => {
    setButtonEnabled(false);
    setFeedbackText("Aggregating...");
    let store: any = window.appStore;
    const result = await serverAPI.callPluginMethod<{}, number>(
      "aggregate_all", { allapps: store.allApps.map((i: any) => [i.appid, i.display_name])});
    if (result.success && result.result >= 0) {
      setFeedbackText("Copied " + result.result + " files");
    } else {
      setFeedbackText("Something went wrong during aggregation. Please check logs.");
    }
    setButtonEnabled(true);
  };

  const onToggleCopyMostRecent = async (e: boolean) => {
    setCopyMostRecent(e);
    await Settings.setSetting("copy_most_recent", e);
  };

  const onToggleFolderPerGame = async (e: boolean) => {
    setFolderPerGame(e);
    await Settings.setSetting("folder_per_game", e);
  };

  console.log("router");
  console.log(Router);

  return (
    <PanelSection title="Panel Section">
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={onClickAggragateButton} disabled={!buttonEnabled}>Aggregate!</ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div>{feedbackText}</div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField label="Copy Most Recent" checked={copyMostRecent} onChange={onToggleCopyMostRecent}/>
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField label="Folder Per Game" checked={folderPerGame} onChange={onToggleFolderPerGame}/>
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  let store: any = window.appStore;
  Settings.init(serverApi);
  serverApi.callPluginMethod("set_id_map_fronend", {allapps: store.allApps.map((i: any) => [i.appid, i.display_name])});
  let screenshot_register = window.SteamClient.GameSessions.RegisterForScreenshotNotification(async (data: any) => {
    console.log(data);
    let res = await serverApi.callPluginMethod("copy_screenshot", { app_id: data.unAppID, url: data.details.strUrl});
    if (!res.result) {
      serverApi.toaster.toast({
        title: "Shotty",
        body: "Failed to symlink screenshot",
        duration: 1000,
        critical: true
      })
    }
  });

  return {
    title: <div className={staticClasses.Title}>Screentshot Aggregator</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <HiOutlineCamera />,
    onDismount() {
      screenshot_register.unregister();
    },
  };
});
