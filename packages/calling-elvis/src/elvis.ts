import { IElvisWidget, Widget } from "elvis-web";
import Router from "./router";
import StatefulWidget from "./state";

interface IElvis {
  home: StatefulWidget;
  router?: Router;
}

class Elvis {
  public static call(widget: IElvisWidget) {
    widget.calling();
  }

  public router: Router;
  private home: StatefulWidget;
  private init: boolean;

  constructor(props: IElvis) {
    this.init = true;

    // init global route
    (window as any).route = () => {
      const ptr: string = window.location.pathname.slice(1);
      const widget: any = this.router.routes[ptr];
      if (
        widget instanceof StatefulWidget
        || widget instanceof Widget
      ) {
        widget.calling();
      }
    };

    // setters
    this.router = props.router;
    this.home = props.home;
    if (window.location.pathname === "/") {
      (!this.init) && this.home.calling();
    } else {
      this.init && (this.init = false);
      (window as any).route();
    }
  }

  public calling() {
    this.home.calling();
  }
}

export default Elvis;
