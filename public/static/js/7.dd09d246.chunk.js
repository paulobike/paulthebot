(this["webpackJsonpichie-site"]=this["webpackJsonpichie-site"]||[]).push([[7],{31:function(e,t,n){"use strict";var r=n(33),c=n.n(r).a.create({baseURL:"https://paulthebot.herokuapp.com"});t.a=c},32:function(e,t,n){"use strict";function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}n.d(t,"a",(function(){return a}))},68:function(e,t,n){"use strict";n.r(t);var r=n(0),c=n(32),a=n(34),s=n(1),o=n(31);t.default=function(e){var t=Object(s.useState)(!1),n=Object(a.a)(t,2),i=n[0],l=n[1],u=Object(s.useState)(""),b=Object(a.a)(u,2),j=b[0],p=b[1],d=Object(s.useState)({margin:0}),h=Object(a.a)(d,2),O=h[0],f=h[1],g=function(){Object(o.a)("/options",{headers:{"X-Auth-token":localStorage.getItem("X-Auth-token")}}).then((function(t){var n=t.data;if(console.log(n),401==n.status&&(alert("You need to log in"),e.history.push("/login")),200==n.status){var r={};n.options.forEach((function(e){r[e.name]=e.value})),f(r)}})).catch((function(e){alert(e.message||"something went wrong")}))};return Object(s.useEffect)((function(){g()}),[]),Object(r.jsx)("div",{id:"page-wrapper",children:Object(r.jsx)("div",{id:"page-inner",children:Object(r.jsx)("div",{className:"row text-center",style:{display:"flex",justifyContent:"center"},children:Object(r.jsxs)("div",{className:"col-lg-6 col-md-8 col-sm-10 col-xs-10 text-center",children:[Object(r.jsx)("h3",{children:"Preferences"}),Object(r.jsx)("br",{}),Object(r.jsx)("div",{className:"row",children:Object(r.jsxs)("div",{className:"panel panel-primary",children:[Object(r.jsx)("div",{className:"panel-heading",children:"Customize your bot!"}),Object(r.jsxs)("div",{className:"panel-body",children:[Object(r.jsxs)("div",{class:"input-group",children:[Object(r.jsx)("span",{class:"input-group-addon",children:"Margin"}),Object(r.jsx)("input",{type:"number",class:"form-control",onChange:function(e){f((function(t){return Object(c.a)(Object(c.a)({},t),{},{margin:e.target.value})}))},value:O.margin}),Object(r.jsx)("span",{class:"input-group-addon btn btn-info",style:{backgroundColor:"#428bca",color:"white"},onClick:function(t){return n="margin",l(!0),p("Loading"),void o.a.put("/options",{name:n,value:O[n]},{headers:{"X-Auth-token":localStorage.getItem("X-Auth-token")}}).then((function(t){var r=t.data;l(!1),401==r.status&&(p(r.message),e.history.push("/login")),200==r.status&&(p(n+" updated"),g())})).catch((function(e){console.log(e),alert(e.message||"something went wrong"),l(!1),p("Try again")}));var n},disabled:i,children:"Save"})]}),Object(r.jsx)("br",{}),Object(r.jsx)("br",{})]}),Object(r.jsx)("div",{className:"panel-footer",children:j||"These values will alter the bot's performance"})]})})]})})})})}}}]);
//# sourceMappingURL=7.dd09d246.chunk.js.map