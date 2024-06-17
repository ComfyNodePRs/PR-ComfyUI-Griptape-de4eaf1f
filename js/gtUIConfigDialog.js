import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { $el } from "../../../scripts/ui.js";
import { ComfyWidgets } from "../../../scripts/widgets.js";
import { ComfyDialog } from "../../../scripts/ui/dialog.js";


export class GriptapeConfigDialog  extends ComfyDialog{
  constructor(app) {
    super();
    this.app = app;
    this.settingsValues = {};
    this.settingsLookup = {};
    this.element = $el("div.comfy-modal", { parent: document.body }, [
      $el("div.comfy-modal-content", [
        $el("p", { $: (p) => (this.textElement = p) }),
        ...this.createButtons(),
      ]),
    ]);

  }

  async setSettingValueAsync(id, value) {
    const json = JSON.stringify(value);
    localStorage["Comfy.Settings.gtUI." + id] = json; // backwards compatibility for extensions keep setting in storage

    let oldValue = this.getSettingValue(id, undefined);
    console.log("Setting value", id, value, oldValue);
    this.settingsValues[this.getId(id)] = value;

    if (id in this.settingsLookup) {
      this.settingsLookup[id].onChange?.(value, oldValue);
    }

    await api.storeSetting(id, value);
  }

  setSettingValue(id, value) {
    this.setSettingValueAsync(id, value).catch((err) => {
      alert(`Error saving setting '${id}'`);
      console.error(err);
    });
  }
  getSettingValue(id, defaultValue) {
    let value = this.settingsValues[this.getId(id)];
    if(value != null) {
      if(this.app.storageLocation === "browser") {
        try {
          value = JSON.parse(value);
        } catch (error) {
        }
      }
    }
    return value ?? defaultValue;
  }
  getId(id) {
    if (this.app.storageLocation === "browser") {
      id = "Comfy.Settings.gtUI." + id;
    }
    return id;
  }
  get settings() {
		return Object.values(this.settingsLookup);
	}

  async loadSettings() {
		if (this.app.storageLocation === "browser") {
			this.settingsValues = localStorage;
		} else {
			this.settingsValues = await api.getSettings();
		}

		// Trigger onChange for any settings added before load
		for (const id in this.settingsLookup) {
			this.settingsLookup[id].onChange?.(this.settingsValues[this.getId(id)]);
		}
  }

  async show() {
    await this.loadSettings();
    let OPENAI_API_KEY = this.getSettingValue("OPENAI_API_KEY");
    let fart = this.getSettingValue("fart");
    const html = $el("div", { className: "gtUI-modal-content" }, [
      $el("h1", { textContent: "Griptape API Keys", className: "gtUI-title" }),
      $el("p", { textContent: "Griptape ComfyUI nodes require some API keys in order to operate properly. Enter your API keys here, or place them in a .env file in your ComfyUI folder." }),
      $el("div", { className: "gtUI-input-row" }, [
        $el("label", { textContent: "OpenAI API Key", className: "gtUI-label" }),
        $el("input", { type: "text", placeholder: OPENAI_API_KEY, className: "gtUI-input" }),
      ]),
      $el("div", { className: "gtUI-input-row" }, [
        $el("label", { textContent: "AWS_ACCESS_KEY_ID", className: "gtUI-label" }),
        $el("input", { type: "text", placeholder: "123456789abcdefghij", className: "gtUI-input" }),
      ]),
      $el("div", { className: "gtUI-input-row" }, [
        $el("label", { textContent: "FART", className: "gtUI-label" }),
        $el("input", { type: "text", placeholder: fart, className: "gtUI-input" }),
      ]),

    ]);
    let value = this.getSettingValue("fart")

    console.log("Trying to get gtUI", value)
    this.textElement.replaceChildren(html);
    this.element.style.display = "flex";
  }

  createButtons() {
    const buttonContainer = $el(
      "div",
      { style: { display: "flex", gap: "10px", justifyContent: "center" } },
      [
        $el("button", {
          type: "button",
          textContent: "Close",
          style: {
            padding: "8px",
          },
          onclick: () => this.close(),
        }),
        $el("button", {
          type: "button",
          textContent: "Save",
          style: {
            padding: "8px",
          },
          onclick: () => this.save(),
        }),
      ]
    );
    return [buttonContainer];
  }
  save() {
    console.log("Save action triggered");
  }

  close() {
    this.element.style.display = "none";
  }
}
