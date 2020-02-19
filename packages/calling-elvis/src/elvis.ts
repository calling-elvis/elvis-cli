import { Elvis as ElvisPrototype, State as ElvisState, Widget } from "../../../../elvis/web/pkg";
import Router from "./router";
import State from "./state";

interface IElvis {
  home: State;
  router?: Router;
}

class Elvis {
  public static call(widget: State | Widget) {
    new ElvisPrototype(State.trans(widget)).calling();
  }

  public router: Router;
  private home: State;
  private proto: ElvisPrototype;

  constructor(props: IElvis) {
    // init global route
    (window as any).route = () => {
      const ptr: string = window.location.pathname.slice(1);
      const widget: any = this.router.routes[ptr];
      if (widget instanceof State) {
        this.proto = new ElvisPrototype(State.trans(widget));
        this.calling();
      }
    };

    // setters
    this.router = props.router;
    this.home = props.home;
    if (window.location.pathname === "/") {
      this.proto = new ElvisPrototype(State.trans(this.home));
    } else {
      (window as any).route();
    }
  }

  public calling() {
    this.proto.calling();
  }
}

export default Elvis;
