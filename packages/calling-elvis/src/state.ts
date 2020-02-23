import { Widget } from "elvis-web";

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
        this.widget.setIdx(this.id);
        if (this.widget.patch()) {
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

  public share(): Widget {
    this.widget = this.render();
    if (this.id === undefined) {
      this.id = "widget-" + Math.random().toString(16).slice(3, 9);
    }

    this.widget.setIdx(this.id);
    this.widget.style();
    this.trigger(Process.Create);
    return this.widget;
  }

  public calling(): void {
    this.widget = this.render();
    this.id = "page-" + Math.random().toString(16).slice(3, 9);
    this.widget.setIdx(this.id);
    this.widget.calling();
    this.trigger(Process.Create);
  }

  public render(): Widget {
    return new Widget();
  }

  public create(): void { }
  public update(): void { }
  public dispose(): void { }
}

export default StatefulWidget;
