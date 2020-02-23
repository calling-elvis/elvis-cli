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
  constructor() { }

  protected trigger(p: Process) {
    switch (p) {
      case Process.Create:
        this.create();
        this.widget = this.render();
        let shouldUpdate: boolean = this.widget.patch();
        if (shouldUpdate) {
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
