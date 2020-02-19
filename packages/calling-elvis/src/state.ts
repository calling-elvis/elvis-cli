import { Text } from "./widgets";
import { State as ElvisState, Widget } from "../../../../elvis/web/pkg";

class State {
  static from(widget: Widget): State {
    let sw = new State();
    sw.render = () => widget;
    return sw;
  }

  static into(s: State): ElvisState {
    if (s.proto === undefined) {
      let widget: Widget = s.render();
      return new ElvisState(widget, s.create, s.update, s.dispose);
    }

    for (const k in s.state) {
      s.proto.set_state(k, JSON.stringify(s.state.get(k)));
    }

    return s.proto;
  }

  static trans(w: Widget | State): ElvisState {
    if (w instanceof Widget) {
      return State.into(State.from(w));
    }
    return State.into(w);
  }

  state: Map<string, object>;
  proto: ElvisState;

  constructor() {
    this.proto = new ElvisState(this.render(), this.create, this.update, this.dispose);
  }

  protected setState(obj: object) {
    Object.assign(this.state, obj);
  }

  public render(): Widget {
    return Text("Calling Elvis!");
  }

  public create(): void { }
  public update(): void { }
  public dispose(): void { }
}

export default State;
