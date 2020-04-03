import {
  Align as ElvisAlign,
  AlignStyle,
  Col as ElvisCol,
  Center as ElvisCenter,
  Container as ElvisContainer,
  ContainerStyle,
  Flex as ElvisFlex,
  FlexStyle,
  Grid as ElvisGrid,
  GridStyle,
  IAlignStyle,
  IContainerStyle,
  IElvisWidget,
  IFlexStyle,
  IGridStyle,
  IMultiColumnStyle,
  ISizedBoxStyle,
  List as ElvisList,
  MultiColumn as ElvisMultiColumn,
  MultiColumnStyle,
  Row as ElvisRow,
  SizedBox as ElvisSizedBox,
  SizedBoxStyle,
  Widget,
} from "elvis-web";
import { widgetPipe } from "./share";

export function Align(widget: IElvisWidget, style: IAlignStyle): Widget {
  return ElvisAlign(widgetPipe(widget), new AlignStyle(style.align));
}

export function Col(widgets: IElvisWidget[]): Widget {
  const col = new ElvisCol();
  for (const i in widgets) {
    if (widgets[i] !== undefined) {
      col.push(widgetPipe(widgets[i]));
    }
  }

  return col.widget();
}

export function Center(widget: IElvisWidget): Widget {
  return ElvisCenter(widgetPipe(widget));
}

export function Container(widget: IElvisWidget, style?: IContainerStyle): Widget {
  if (style === undefined) {
    style = {};
  }

  return ElvisContainer(widgetPipe(widget), new ContainerStyle(
    style.align,
    style.color,
    style.height,
    style.margin,
    style.padding,
    style.width,
  ));
}

export function Flex(widget: IElvisWidget, style?: IFlexStyle): Widget {
  if (style === undefined) {
    style = {};
  }

  return ElvisFlex(widgetPipe(widget), new FlexStyle(
    style.align,
    style.basis,
    style.direction,
    style.grow,
    style.order,
    style.wrap,
  ));
}

export function Grid(widgets: IElvisWidget[], style?: IGridStyle): Widget {
  if (style === undefined) {
    style = {};
  }

  const grid = new ElvisGrid(new GridStyle(
    style.col,
    style.col_gap,
    style.flow,
    style.row,
    style.row_gap,
    style.template_col,
    style.template_row,
  ));

  for (const i in widgets) {
    if (widgets[i] !== undefined) {
      grid.push(widgetPipe(widgets[i]));
    }
  }

  return grid.widget();
}

export function List(widgets: IElvisWidget[]): Widget {
  const list = new ElvisList();
  for (const i in widgets) {
    if (widgets[i] !== undefined) {
      list.push(widgetPipe(widgets[i]));
    }
  }

  return list.widget();
}

export function MultiColumn(widgets: IElvisWidget[], style?: IMultiColumnStyle): Widget {
  if (style === undefined) {
    style = {};
  }

  const mc = new ElvisMultiColumn(new MultiColumnStyle(
    style.color,
    style.count,
    style.gap,
    style.style,
  ));
  for (const i in widgets) {
    if (widgets[i] !== undefined) {
      mc.push(widgetPipe(widgets[i]));
    }
  }

  return mc.widget();
}

export function Row(widgets: IElvisWidget[]): Widget {
  const row = new ElvisRow();
  for (const i in widgets) {
    if (widgets[i] !== undefined) {
      row.push(widgetPipe(widgets[i]));
    }
  }

  return row.widget();
}

export function SizedBox(widget: IElvisWidget, style: ISizedBoxStyle): Widget {
  return ElvisSizedBox(widgetPipe(widget), new SizedBoxStyle(style.height, style.width));
}
