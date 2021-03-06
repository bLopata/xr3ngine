import { Component } from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Modal } from "react-modal";
import styled from "styled-components";
import configs from "../../../components/editor/configs";
import Editor from "../../../components/editor/Editor";
import { createEditor } from "../../../components/editor/nodes/Nodes";
import { DialogContextProvider } from "../../../components/editor/ui/contexts/DialogContext";
import { EditorContextProvider } from "../../../components/editor/ui/contexts/EditorContext";
import { OnboardingContextProvider } from "../../../components/editor/ui/contexts/OnboardingContext";
import { defaultSettings, SettingsContextProvider } from "../../../components/editor/ui/contexts/SettingsContext";
import ConfirmDialog from "../../../components/editor/ui/dialogs/ConfirmDialog";
import ErrorDialog from "../../../components/editor/ui/dialogs/ErrorDialog";
import ExportProjectDialog from "../../../components/editor/ui/dialogs/ExportProjectDialog";
import ProgressDialog from "../../../components/editor/ui/dialogs/ProgressDialog";
import SaveNewProjectDialog from "../../../components/editor/ui/dialogs/SaveNewProjectDialog";
import DragLayer from "../../../components/editor/ui/dnd/DragLayer";
import DndProvider from "../../../components/editor/ui/EditorContainer";
import HierarchyPanelContainer from "../../../components/editor/ui/hierarchy/HierarchyPanelContainer";
import { Resizeable } from "../../../components/editor/ui/layout/Resizeable";
import Onboarding from "../../../components/editor/ui/onboarding/Onboarding";
import PropertiesPanelContainer from "../../../components/editor/ui/properties/PropertiesPanelContainer";
import BrowserPrompt from "../../../components/editor/ui/router/BrowserPrompt";
import ToolBar from "../../../components/editor/ui/toolbar/ToolBar";
import { cmdOrCtrlString } from "../../../components/editor/ui/utils";
import ViewportPanelContainer from "../../../components/editor/ui/viewport/ViewportPanelContainer";
import defaultTemplateUrl from "../crater.json";
import tutorialTemplateUrl from "../tutorial.json";

//  BrowserPrompt
const StyledEditorContainer = (styled as any).div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: fixed;
`;
const WorkspaceContainer = (styled as any).div`
  display: flex;
  flex: 1;
  overflow: hidden;
  margin: 6px;
`;
type EditorContainerProps = {
  api: any;
  history: any;
  match: any;
  location: any;
};
type EditorContainerState = {
  onboardingContext: { enabled: boolean };
  project: null;
  parentSceneId: null;
  templateUrl: any;
  settingsContext: any;
  error: null;
  editor: any;
  creatingProject: any;
  DialogComponent: null;
  dialogProps: {};
  modified: boolean;
};
class EditorContainer extends Component<EditorContainerProps, EditorContainerState> {
  constructor(props) {
    super(props);
    let settings = defaultSettings;
    const storedSettings = localStorage.getItem("editor-settings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }
    const editor = createEditor(props.api, settings);
    (window as any).editor = editor;
    editor.init();
    editor.addListener("initialized", this.onEditorInitialized);
    this.state = {
      error: null,
      project: null,
      parentSceneId: null,
      creatingProject: null,
      editor,
      templateUrl: defaultTemplateUrl,
      settingsContext: {
        settings,
        updateSetting: this.updateSetting
      },
      onboardingContext: {
        enabled: false
      },
      DialogComponent: null,
      dialogProps: {},
      modified: false
    };
  }
  componentDidMount() {
    const { match, location } = this.props;
    const projectId = match.params.projectId;
    const queryParams = new URLSearchParams(location.search ?? "");
    if (projectId === "new") {
      if (queryParams.has("template")) {
        this.loadProjectTemplate(queryParams.get("template"));
      } else if (queryParams.has("sceneId")) {
        this.loadScene(queryParams.get("sceneId"));
      } else {
        this.loadProjectTemplate(defaultTemplateUrl);
      }
    } else if (projectId === "tutorial") {
      this.loadProjectTemplate(tutorialTemplateUrl);
    } else {
      this.loadProject(projectId);
    }
    if (projectId === "tutorial") {
      this.setState({ onboardingContext: { enabled: true } });
    }
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.match.url !== prevProps.match.url &&
      !this.state.creatingProject
    ) {
      const prevProjectId = prevProps.match.params.projectId;
      const { projectId } = this.props.match.params;
      const queryParams = new URLSearchParams(location.search  ?? "");
      let templateUrl = null;
      if (projectId === "new" && !queryParams.has("sceneId")) {
        templateUrl = queryParams.get("template") || defaultTemplateUrl;
      } else if (projectId === "tutorial") {
        templateUrl = tutorialTemplateUrl;
      }
      if (projectId === "new" || projectId === "tutorial") {
        this.loadProjectTemplate(templateUrl);
      } else if (prevProjectId !== "tutorial" && prevProjectId !== "new") {
        this.loadProject(projectId);
      }
      if (projectId === "tutorial") {
        this.setState({ onboardingContext: { enabled: true } });
      }
    }
  }
  async loadProjectTemplate(templateUrl) {
    this.setState({
      project: null,
      parentSceneId: null,
      templateUrl
    });
    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });
    const editor = this.state.editor;
    try {
      const templateFile = await this.props.api
        .fetch(templateUrl)
        .then(response => response.json());
      await editor.init();
      if (templateFile.metadata) {
        delete templateFile.metadata.sceneUrl;
        delete templateFile.metadata.sceneId;
        delete templateFile.metadata.creatorAttribution;
        delete templateFile.metadata.allowRemixing;
        delete templateFile.metadata.allowPromotion;
      }
      await editor.loadProject(templateFile);
      this.hideDialog();
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error loading project.",
        message:
          error.message || "There was an error when loading the project.",
        error
      });
    }
  }
  async loadScene(sceneId) {
    this.setState({
      project: null,
      parentSceneId: sceneId,
      templateUrl: null,
      onboardingContext: { enabled: false }
    });
    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });
    const editor = this.state.editor;
    try {
      const scene = await this.props.api.getScene(sceneId);
      const projectFile = await this.props.api
        .fetch(scene.scene_project_url)
        .then(response => response.json());
      if (projectFile.metadata) {
        delete projectFile.metadata.sceneUrl;
        delete projectFile.metadata.sceneId;
        delete projectFile.metadata.creatorAttribution;
        delete projectFile.metadata.allowRemixing;
        delete projectFile.metadata.allowPromotion;
      }
      await editor.init();
      await editor.loadProject(projectFile);
      this.hideDialog();
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error loading project.",
        message:
          error.message || "There was an error when loading the project.",
        error
      });
    }
  }
  async importProject(projectFile) {
    const project = this.state.project;
    this.setState({
      project: null,
      parentSceneId: null,
      templateUrl: null,
      onboardingContext: { enabled: false }
    });
    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });
    const editor = this.state.editor;
    try {
      await editor.init();
      await editor.loadProject(projectFile);
      editor.sceneModified = true;
      this.updateModifiedState(()=> {
        this.hideDialog();
      });
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error loading project.",
        message:
          error.message || "There was an error when loading the project.",
        error
      });
    } finally {
      if (project) {
        this.setState({
          project
        });
      }
    }
  }
  async loadProject(projectId) {
    this.setState({
      project: null,
      parentSceneId: null,
      templateUrl: null,
      onboardingContext: { enabled: false }
    });
    this.showDialog(ProgressDialog, {
      title: "Loading Project",
      message: "Loading project..."
    });
    const editor = this.state.editor;
    let project;
    try {
      project = await this.props.api.getProject(projectId);
      const projectFile = await this.props.api
        .fetch(project.project_url)
        .then(response => response.json());
      await editor.init();
      await editor.loadProject(projectFile);
      this.hideDialog();
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error loading project.",
        message:
          error.message || "There was an error when loading the project.",
        error
      });
    } finally {
      if (project) {
        this.setState({
          project
        });
      }
    }
  }
  updateModifiedState = then => {
    const nextModified =
      this.state.editor.sceneModified && !this.state.creatingProject;
    if (nextModified !== this.state.modified) {
      this.setState({ modified: nextModified }, then);
    } else if (then) {
      then();
    }
  };
  generateToolbarMenu = () => {
    return [
      {
        name: "Back to Projects",
        action: this.onOpenProject
      },
      {
        name: "File",
        items: [
          {
            name: "New Project",
            action: this.onNewProject
          },
          {
            name: "Save Project",
            hotkey: `${cmdOrCtrlString} + S`,
            action: this.onSaveProject
          },
          {
            name: "Save As",
            action: this.onDuplicateProject
          },
          {
            name: "Publish Scene...",
            action: this.onPublishProject
          },
          {
            name: "Export as binary glTF (.glb) ...",
            action: this.onExportProject
          },
          {
            name: "Import legacy .editor project",
            action: this.onImportLegacyProject
          },
          {
            name: "Export legacy .editor project",
            action: this.onExportLegacyProject
          }
        ]
      },
      {
        name: "Help",
        items: [
          {
            name: "Tutorial",
            action: () => {
              const { projectId } = this.props.match.params;
              if (projectId === "tutorial") {
                this.setState({ onboardingContext: { enabled: true } });
              } else {
                this.props.history.push("/projects/tutorial");
              }
            }
          },
          {
            name: "Keyboard and Mouse Controls",
            action: () =>
              window.open(
                "https://github.com/xr3ngine/xr3ngine/wiki/Keyboard-and-Mouse-Controls"
              )
          },
          {
            name: "Report an Issue",
            action: () =>
              window.open("https://github.com/xr3ngine/xr3ngine/issues/new")
          },
          {
            name: "Join us on Discord",
            action: () => window.open("https://discord.gg/mQ3D4FE")
          },
          {
            name: "Terms of Use",
            action: () =>
              window.open(
                "https://github.com/xr3ngine/xr3ngine/blob/master/TERMS.md"
              )
          },
          {
            name: "Privacy Notice",
            action: () =>
              window.open(
                "https://github.com/xr3ngine/xr3ngine/blob/master/PRIVACY.md"
              )
          }
        ]
      },
      {
        name: "Developer",
        items: [
          {
            name: this.state.settingsContext.settings.enableExperimentalFeatures
              ? "Disable Experimental Features"
              : "Enable Experimental Features",
            action: () =>
              this.updateSetting(
                "enableExperimentalFeatures",
                !this.state.settingsContext.settings.enableExperimentalFeatures
              )
          }
        ]
      }
    ];
  };
  onEditorInitialized = () => {
    const editor = this.state.editor;
    const gl = this.state.editor.renderer.renderer.context;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    let webglVendor = "Unknown";
    let webglRenderer = "Unknown";
    if (debugInfo) {
      webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    window.addEventListener("resize", this.onResize);
    this.onResize();
    editor.addListener("projectLoaded", this.onProjectLoaded);
    editor.addListener("error", this.onEditorError);
    editor.addListener("sceneModified", this.onSceneModified);
    editor.addListener("saveProject", this.onSaveProject);
  };
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    const editor = this.state.editor;
    editor.removeListener("sceneModified", this.onSceneModified);
    editor.removeListener("saveProject", this.onSaveProject);
    editor.removeListener("initialized", this.onEditorInitialized);
    editor.removeListener("error", this.onEditorError);
    editor.removeListener("projectLoaded", this.onProjectLoaded);
    editor.dispose();
  }
  onResize = () => {
    this.state.editor.onResize();
  };
  /**
   *  Dialog Context
   */
  showDialog = (DialogComponent, dialogProps = {}) => {
    this.setState({
      DialogComponent,
      dialogProps
    });
  };
  hideDialog = () => {
    this.setState({
      DialogComponent: null,
      dialogProps: {}
    });
  };
  dialogContext = {
    showDialog: this.showDialog,
    hideDialog: this.hideDialog
  };
  /**
   * Scene Event Handlers
   */
  onEditorError = error => {
    if (error["aborted"]) {
      this.hideDialog();
      return;
    }
    console.error(error);
    this.showDialog(ErrorDialog, {
      title: error.title || "Error",
      message: error.message || "There was an unknown error.",
      error
    });
  };
  onSceneModified = () => {
    this.updateModifiedState(null);
  };
  onProjectLoaded = () => {
    this.updateModifiedState(null);
  };
  updateSetting(key, value) {
    const settings = Object.assign(this.state.settingsContext.settings, {
      [key]: value
    });
    localStorage.setItem("editor-settings", JSON.stringify(settings));
    const editor = this.state.editor;
    editor.settings = settings;
    editor.emit("settingsChanged");
    this.setState({
      settingsContext: {
        ...this.state.settingsContext,
        settings
      }
    });
  }
  /**
   *  Project Actions
   */
  async createProject() {
    const { editor, parentSceneId } = this.state;
    this.showDialog(ProgressDialog, {
      title: "Generating Project Screenshot",
      message: "Generating project screenshot..."
    });
    // Wait for 5ms so that the ProgressDialog shows up.
    await new Promise(resolve => setTimeout(resolve, 5));
    const blob = await editor.takeScreenshot(512, 320);
    const result: any = await new Promise(resolve => {
      this.showDialog(SaveNewProjectDialog, {
        thumbnailUrl: URL.createObjectURL(blob),
        initialName: editor.scene.name,
        onConfirm: resolve,
        onCancel: resolve
      });
    });
    if (!result) {
      this.hideDialog();
      return null;
    }
    const abortController = new AbortController();
    this.showDialog(ProgressDialog, {
      title: "Saving Project",
      message: "Saving project...",
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        this.hideDialog();
      }
    });
    editor.setProperty(editor.scene, "name", result.name, false);
    editor.scene.setMetadata({ name: result.name });
    const project = await (this.props.api as any).createProject(
      editor.scene,
      parentSceneId,
      blob,
      abortController.signal,
      this.showDialog,
      this.hideDialog
    );
    editor.sceneModified = false;
    this.updateModifiedState(() => {
      this.setState({ creatingProject: true, project }, () => {
        this.props.history.replace(`/projects/${project.project_id}`);
        this.setState({ creatingProject: false });
      });
    });
    return project;
  }
  onNewProject = async () => {
    this.props.history.push("/projects/templates");
  };
  onOpenProject = () => {
    this.props.history.push("/projects");
  };
  onSaveProject = async () => {
    const abortController = new AbortController();
    this.showDialog(ProgressDialog, {
      title: "Saving Project",
      message: "Saving project...",
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        this.hideDialog();
      }
    });
    // Wait for 5ms so that the ProgressDialog shows up.
    await new Promise(resolve => setTimeout(resolve, 5));
    try {
      const { editor, project } = this.state;
      if (project) {
        const newProject = await this.props.api.saveProject(
          (project as any).project_id,
          editor,
          abortController.signal,
          this.showDialog,
          this.hideDialog
        );
        this.setState({ project: newProject });
      } else {
        await this.createProject();
      }
      editor.sceneModified = false;
      this.updateModifiedState(null);
      this.hideDialog();
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error Saving Project",
        message: error.message || "There was an error when saving the project."
      });
    }
  };
  onDuplicateProject = async () => {
    const abortController = new AbortController();
    this.showDialog(ProgressDialog, {
      title: "Duplicating Project",
      message: "Duplicating project...",
      cancelable: true,
      onCancel: () => {
        abortController.abort();
        this.hideDialog();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 5));
    try {
      const editor = this.state.editor;
      await this.createProject();
      editor.sceneModified = false;
      this.updateModifiedState(() => {
        this.hideDialog();
      });
      
    } catch (error) {
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error Saving Project",
        message: error.message || "There was an error when saving the project."
      });
    }
  };
  onExportProject = async () => {
    const options = await new Promise(resolve => {
      this.showDialog(ExportProjectDialog, {
        defaultOptions: Object.assign({}, Editor.DefaultExportOptions),
        onConfirm: resolve,
        onCancel: resolve
      });
    });
    if (!options) {
      this.hideDialog();
      return;
    }
    const abortController = new AbortController();
    this.showDialog(ProgressDialog, {
      title: "Exporting Project",
      message: "Exporting project...",
      cancelable: true,
      onCancel: () => abortController.abort()
    });
    try {
      const editor = this.state.editor;
      const { glbBlob } = await editor.exportScene(
        abortController.signal,
        options
      );
      this.hideDialog();
      const el = document.createElement("a");
      el.download = editor.scene.name + ".glb";
      el.href = URL.createObjectURL(glbBlob);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    } catch (error) {
      if (error["aborted"]) {
        this.hideDialog();
        return;
      }
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error Exporting Project",
        message:
          error.message || "There was an error when exporting the project.",
        error
      });
    }
  };
  onImportLegacyProject = async () => {
    const confirm = await new Promise(resolve => {
      this.showDialog(ConfirmDialog, {
        title: "Import Legacy Spoke Project",
        message:
          "Warning! This will overwrite your existing scene! Are you sure you wish to continue?",
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
    this.hideDialog();
    if (!confirm) return;
    const el = document.createElement("input");
    el.type = "file";
    el.accept = ".world;";
    el.style.display = "none";
    el.onchange = () => {
      if (el.files.length > 0) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const json = JSON.parse(fileReader.result.toString());
          if (json.metadata) {
            delete json.metadata.sceneUrl;
            delete json.metadata.sceneId;
          }
          this.importProject(json);
        };
        fileReader.readAsText(el.files[0]);
      }
    };
    el.click();
  };
  onExportLegacyProject = async () => {
    const editor = this.state.editor;
    const projectFile = editor.scene.serialize();
    if (projectFile.metadata) {
      delete projectFile.metadata.sceneUrl;
      delete projectFile.metadata.sceneId;
    }
    const projectJson = JSON.stringify(projectFile);
    const projectBlob = new Blob([projectJson]);
    const el = document.createElement("a");
    const fileName = this.state.editor.scene.name
      .toLowerCase()
      .replace(/\s+/g, "-");
    el.download = fileName + ".world;";
    el.href = URL.createObjectURL(projectBlob);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };
  onPublishProject = async () => {
    try {
      const editor = this.state.editor;
      let project = this.state.project;
      if (!project) {
        project = await this.createProject();
      }
      if (!project) {
        return;
      }
      project = await this.props.api.publishProject(
        project,
        editor,
        this.showDialog,
        this.hideDialog
      );
      if (!project) {
        return;
      }
      editor.sceneModified = false;
      this.updateModifiedState(() => {
        this.setState({ project });
      });
    } catch (error) {
      if (error["aborted"]) {
        this.hideDialog();
        return;
      }
      console.error(error);
      this.showDialog(ErrorDialog, {
        title: "Error Publishing Project",
        message: error.message || "There was an unknown error.",
        error
      });
    }
  };
  getSceneId() {
    const { editor, project } = this.state;
    return (
      (project && (project as any).scene && (project as any).scene.scene_id) ||
      (editor.scene.metadata && editor.scene.metadata.sceneId)
    );
  }
  onOpenScene = () => {
    const sceneId = this.getSceneId();
    if (sceneId) {
      const url = this.props.api.getSceneUrl(sceneId);
      window.open(url);
    }
  };
  onFinishTutorial = nextAction => {
    this.setState({ onboardingContext: { enabled: false } });
  };
  onSkipTutorial = lastCompletedStep => {
    this.setState({ onboardingContext: { enabled: false } });
  };
  render() {
    const {
      DialogComponent,
      dialogProps,
      settingsContext,
      onboardingContext,
      editor
    } = this.state;
    const toolbarMenu = this.generateToolbarMenu();
    const isPublishedScene = !!this.getSceneId();
    return (
      <StyledEditorContainer id="editor-container">
        <SettingsContextProvider value={settingsContext}>
          <EditorContextProvider value={editor}>
            <DialogContextProvider value={this.dialogContext}>
              <OnboardingContextProvider value={onboardingContext}>
                <DndProvider backend={HTML5Backend}>
                  <DragLayer />
                  <ToolBar
                    menu={toolbarMenu}
                    editor={editor}
                    onPublish={this.onPublishProject}
                    isPublishedScene={isPublishedScene}
                    onOpenScene={this.onOpenScene}
                  />
                  <WorkspaceContainer>
                    <Resizeable
                      axis="x"
                      initialSizes={[0.7, 0.3]}
                      onChange={this.onResize}
                    >
                      <ViewportPanelContainer />
                      <Resizeable axis="y" initialSizes={[0.5, 0.5]}>
                        <HierarchyPanelContainer />
                        <PropertiesPanelContainer />
                      </Resizeable>
                    </Resizeable>
                  </WorkspaceContainer>
                  <Modal
                    ariaHideApp={false}
                    isOpen={!!DialogComponent}
                    onRequestClose={this.hideDialog}
                    shouldCloseOnOverlayClick={false}
                    className="Modal"
                    overlayClassName="Overlay"
                  >
                    {DialogComponent && (
                      <DialogComponent
                        onConfirm={this.hideDialog}
                        onCancel={this.hideDialog}
                        {...dialogProps}
                      />
                    )}
                  </Modal>
                    <title>{`${this.state.modified ? "*" : ""}${
                      editor.scene.name
                    } | ${(configs as any).longName()}`}</title>
                    <meta
                      name="viewport"
                      content="width=device-width, initial-scale=1, user-scalable=no"
                    />
                  {this.state.modified && (
                    <BrowserPrompt
                      message={`${
                        editor.scene.name
                      } has unsaved changes, are you sure you wish to navigate away from the page?`}
                    />
                  )}
                  {onboardingContext.enabled && (
                    <Onboarding
                      onFinish={this.onFinishTutorial}
                      onSkip={this.onSkipTutorial}
                    />
                  )}
                </DndProvider>
              </OnboardingContextProvider>
            </DialogContextProvider>
          </EditorContextProvider>
        </SettingsContextProvider>
      </StyledEditorContainer>
    );
  }
}