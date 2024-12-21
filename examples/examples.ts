console.log(window.location.pathname);
if(window.location.pathname.endsWith("init-api")){
  import("./init-api/main");
}
if(window.location.pathname.endsWith("dingus")){
  import("./dingus/main");
}
