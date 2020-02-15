/* elvis spa caller */
import { Router, Elvis } from "calling-elvis"
import Index from "../examples/hello-world/pages/index";

new Elvis({
  home: Index,
  router: new Router({
    "index": Index,
  }),
}).calling();