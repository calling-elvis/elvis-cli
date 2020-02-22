import { Widget } from "../../../../elvis/web/pkg";

enum Process {
  Create,
  Update,
  Dispose,
}

class StatefulWidget {
  public state: any;
  protected widget: Widget;
  protected id: string;
  private modified: boolean;
  constructor() { }

  protected setState(obj: object) {
    // this.preState = JSON.stringify(this.state);
    if (!this.modified) {
      this.modified = true;
    }
    this.state = Object.assign(this.state, obj);
  }

  protected trigger(p: Process) {
    switch (p) {
      case Process.Create:
        this.create();
        if (this.modified) {
          this.widget = this.render();
          this.widget.patch();
          this.trigger(Process.Update);
        }
        break;
      case Process.Update:
        this.update();
        break;
      default:
        break;
    }
  }

  public render(): Widget {
    return new Widget();
  }

  public calling(): void {
    this.widget = this.render();
    this.widget.calling();
    this.trigger(Process.Create);
  }

  public create(): void { }
  public update(): void { }
  public dispose(): void { }
}

export default StatefulWidget;
