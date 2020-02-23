import { IElvisWidget, Widget } from "elvis-web";
import StatefulWidget from "./state";

export function widgetPipe(widget: IElvisWidget): Widget {
  if (widget instanceof Widget) {
    return widget;
  } else if (widget instanceof StatefulWidget) {
    return widget.share();
  } else {
    return new Widget();
  }
}
