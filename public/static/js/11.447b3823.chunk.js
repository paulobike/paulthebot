(this["webpackJsonpichie-site"]=this["webpackJsonpichie-site"]||[]).push([[11],{31:function(e,t,a){"use strict";var s=a(37),n=a.n(s).a.create({baseURL:"http://paulthebot.chevrtech.com/"});t.a=n},97:function(e,t,a){"use strict";a.r(t);var s=a(0),n=a(40),c=a(1),o=a(31);t.default=function(e){var t=Object(c.useState)(!1),a=Object(n.a)(t,2),i=a[0],r=a[1],l=Object(c.useState)(""),d=Object(n.a)(l,2),u=d[0],p=d[1],b=Object(c.useState)([]),h=Object(n.a)(b,2),j=h[0],g=h[1],m=Object(c.useState)(""),f=Object(n.a)(m,2),O=f[0],x=f[1],v=function(){Object(o.a)("/pairs",{headers:{"X-Auth-token":localStorage.getItem("X-Auth-token")}}).then((function(t){var a=t.data;console.log(a.status),401==a.status&&(alert("You need to log in"),e.history.push("/login")),200==a.status&&g(a.pairs)})).catch((function(e){alert(e.message||"something went wrong")}))};return Object(c.useEffect)((function(){v()}),[]),Object(s.jsx)("div",{id:"page-wrapper",children:Object(s.jsx)("div",{id:"page-inner",children:Object(s.jsx)("div",{className:"row text-center",style:{display:"flex",justifyContent:"center"},children:Object(s.jsxs)("div",{className:"col-lg-6 col-md-8 col-sm-10 col-xs-10 text-center",children:[Object(s.jsx)("h3",{children:"Trading pairs"}),Object(s.jsx)("br",{}),Object(s.jsx)("div",{className:"row",children:Object(s.jsxs)("div",{className:"panel panel-primary",children:[Object(s.jsx)("div",{className:"panel-heading",children:"Add or delete pairs!"}),Object(s.jsxs)("div",{className:"panel-body",children:[j.length<1?Object(s.jsx)("div",{children:"No pairs yet! Add one below"}):j.map((function(t){return Object(s.jsxs)("div",{className:"input-group",style:{paddingBottom:20},children:[Object(s.jsx)("span",{className:"input-group-addon",children:t.symbol}),Object(s.jsx)("input",{type:"text",className:"form-control",disabled:!0,style:{backgroundColor:"#fff"},value:"Trading: "+(t.inTrade?"Yes":"No")}),Object(s.jsx)("span",{className:"input-group-addon btn btn-warning",style:{color:"#a94442",backgroundColor:"#f2dede"},onClick:function(a){return s=t._id,n=t.symbol,r(!0),p("Loading"),void o.a.delete("/pairs/"+s,{headers:{"X-Auth-token":localStorage.getItem("X-Auth-token")}}).then((function(t){var a=t.data;r(!1),401==a.status&&(p(a.message),e.history.push("/login")),200==a.status&&(p(n+" pair deleted"),v())})).catch((function(e){console.log(e),alert(e.message||"something went wrong"),r(!1),p("Try again")}));var s,n},disabled:i,children:"Delete"})]},t._id)})),Object(s.jsx)("br",{}),Object(s.jsxs)("div",{className:"input-group",children:[Object(s.jsx)("span",{className:"input-group-addon",children:"ADD"}),Object(s.jsx)("input",{type:"text",className:"form-control",placeholder:"Symbol e.g. BTCUSDT",value:O,onChange:function(e){x((function(){return e.target.value}))}}),Object(s.jsx)("span",{className:"input-group-addon btn btn-success",style:{color:"#fff",backgroundColor:"#5cb85c"},disabled:i,onClick:function(){r(!0),p("Loading"),o.a.post("/pairs",{symbol:O},{headers:{"X-Auth-token":localStorage.getItem("X-Auth-token")}}).then((function(t){var a=t.data;r(!1),401==a.status&&(p(a.message),e.history.push("/login")),200==a.status&&(p(O+" pair has been added"),v(),x(""))})).catch((function(e){alert(e.response&&e.response.data&&e.response.data.message?e.response.data.message:"something went wrong"),r(!1),p("Try again")}))},children:"Submit"})]})]}),Object(s.jsx)("div",{className:"panel-footer",children:u||"Please cross-check before adding a pair"})]})})]})})})})}}}]);
//# sourceMappingURL=11.447b3823.chunk.js.map