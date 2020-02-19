import { Widget } from "../../../../elvis/web/pkg";
import State from "./state";

interface IRoutes {
  [name: string]: State | Widget;
}

class Router {
  public static back() {
    window.history.back();
  }

  public static push(path: string, pushProps = { props: {}, title: document.title }): void {
    if (window.location.pathname.slice(1) === path) {
      return;
    }

    window.history.pushState(pushProps.props, pushProps.title, path);
    (window as any).route();
  }

  public routes: IRoutes;

  constructor(routes?: IRoutes) {
    for (const p in routes) {
      if (routes[p] instanceof Widget) {
        routes[p] = State.trans(routes[p]);
      }
    }
    this.routes = routes;
  }
}


export default Router;
