import{r as c,$ as rr,a as nr,b as ar}from"./react-vendor-D8JZSk8j.js";var it={exports:{}},fe={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var or=c,sr=Symbol.for("react.element"),ir=Symbol.for("react.fragment"),cr=Object.prototype.hasOwnProperty,lr=or.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,dr={key:!0,ref:!0,__self:!0,__source:!0};function ct(e,t,r){var n,a={},o=null,i=null;r!==void 0&&(o=""+r),t.key!==void 0&&(o=""+t.key),t.ref!==void 0&&(i=t.ref);for(n in t)cr.call(t,n)&&!dr.hasOwnProperty(n)&&(a[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)a[n]===void 0&&(a[n]=t[n]);return{$$typeof:sr,type:e,key:o,ref:i,props:a,_owner:lr.current}}fe.Fragment=ir;fe.jsx=ct;fe.jsxs=ct;it.exports=fe;var v=it.exports,ze=function(e,t){return ze=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(r,n){r.__proto__=n}||function(r,n){for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(r[a]=n[a])},ze(e,t)};function Ta(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");ze(e,t);function r(){this.constructor=e}e.prototype=t===null?Object.create(t):(r.prototype=t.prototype,new r)}var O=function(){return O=Object.assign||function(t){for(var r,n=1,a=arguments.length;n<a;n++){r=arguments[n];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(t[o]=r[o])}return t},O.apply(this,arguments)};function lt(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var a=0,n=Object.getOwnPropertySymbols(e);a<n.length;a++)t.indexOf(n[a])<0&&Object.prototype.propertyIsEnumerable.call(e,n[a])&&(r[n[a]]=e[n[a]]);return r}function _a(e){var t=typeof Symbol=="function"&&Symbol.iterator,r=t&&e[t],n=0;if(r)return r.call(e);if(e&&typeof e.length=="number")return{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")}function Ia(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),a,o=[],i;try{for(;(t===void 0||t-- >0)&&!(a=n.next()).done;)o.push(a.value)}catch(s){i={error:s}}finally{try{a&&!a.done&&(r=n.return)&&r.call(n)}finally{if(i)throw i.error}}return o}function ur(e,t,r){if(r||arguments.length===2)for(var n=0,a=t.length,o;n<a;n++)(o||!(n in t))&&(o||(o=Array.prototype.slice.call(t,0,n)),o[n]=t[n]);return e.concat(o||Array.prototype.slice.call(t))}function q(e,t,{checkForDefaultPrevented:r=!0}={}){return function(a){if(e==null||e(a),r===!1||!a.defaultPrevented)return t==null?void 0:t(a)}}function fr(e,t){const r=c.createContext(t),n=o=>{const{children:i,...s}=o,f=c.useMemo(()=>s,Object.values(s));return v.jsx(r.Provider,{value:f,children:i})};n.displayName=e+"Provider";function a(o){const i=c.useContext(r);if(i)return i;if(t!==void 0)return t;throw new Error(`\`${o}\` must be used within \`${e}\``)}return[n,a]}function pr(e,t=[]){let r=[];function n(o,i){const s=c.createContext(i),f=r.length;r=[...r,i];const d=h=>{var g;const{scope:m,children:b,...x}=h,u=((g=m==null?void 0:m[e])==null?void 0:g[f])||s,y=c.useMemo(()=>x,Object.values(x));return v.jsx(u.Provider,{value:y,children:b})};d.displayName=o+"Provider";function p(h,m){var u;const b=((u=m==null?void 0:m[e])==null?void 0:u[f])||s,x=c.useContext(b);if(x)return x;if(i!==void 0)return i;throw new Error(`\`${h}\` must be used within \`${o}\``)}return[d,p]}const a=()=>{const o=r.map(i=>c.createContext(i));return function(s){const f=(s==null?void 0:s[e])||o;return c.useMemo(()=>({[`__scope${e}`]:{...s,[e]:f}}),[s,f])}};return a.scopeName=e,[n,hr(a,...t)]}function hr(...e){const t=e[0];if(e.length===1)return t;const r=()=>{const n=e.map(a=>({useScope:a(),scopeName:a.scopeName}));return function(o){const i=n.reduce((s,{useScope:f,scopeName:d})=>{const h=f(o)[`__scope${d}`];return{...s,...h}},{});return c.useMemo(()=>({[`__scope${t.scopeName}`]:i}),[i])}};return r.scopeName=t.scopeName,r}function yr(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}function dt(...e){return t=>e.forEach(r=>yr(r,t))}function U(...e){return c.useCallback(dt(...e),e)}var pe=c.forwardRef((e,t)=>{const{children:r,...n}=e,a=c.Children.toArray(r),o=a.find(vr);if(o){const i=o.props.children,s=a.map(f=>f===o?c.Children.count(i)>1?c.Children.only(null):c.isValidElement(i)?i.props.children:null:f);return v.jsx(je,{...n,ref:t,children:c.isValidElement(i)?c.cloneElement(i,void 0,s):null})}return v.jsx(je,{...n,ref:t,children:r})});pe.displayName="Slot";var je=c.forwardRef((e,t)=>{const{children:r,...n}=e;if(c.isValidElement(r)){const a=br(r);return c.cloneElement(r,{...gr(n,r.props),ref:t?dt(t,a):a})}return c.Children.count(r)>1?c.Children.only(null):null});je.displayName="SlotClone";var mr=({children:e})=>v.jsx(v.Fragment,{children:e});function vr(e){return c.isValidElement(e)&&e.type===mr}function gr(e,t){const r={...t};for(const n in t){const a=e[n],o=t[n];/^on[A-Z]/.test(n)?a&&o?r[n]=(...s)=>{o(...s),a(...s)}:a&&(r[n]=a):n==="style"?r[n]={...a,...o}:n==="className"&&(r[n]=[a,o].filter(Boolean).join(" "))}return{...e,...r}}function br(e){var n,a;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(a=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:a.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}var de=globalThis!=null&&globalThis.document?c.useLayoutEffect:()=>{},kr=rr.useId||(()=>{}),xr=0;function we(e){const[t,r]=c.useState(kr());return de(()=>{e||r(n=>n??String(xr++))},[e]),e||(t?`radix-${t}`:"")}var wr=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","span","svg","ul"],_=wr.reduce((e,t)=>{const r=c.forwardRef((n,a)=>{const{asChild:o,...i}=n,s=o?pe:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),v.jsx(s,{...i,ref:a})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function Mr(e,t){e&&nr.flushSync(()=>e.dispatchEvent(t))}function W(e){const t=c.useRef(e);return c.useEffect(()=>{t.current=e}),c.useMemo(()=>(...r)=>{var n;return(n=t.current)==null?void 0:n.call(t,...r)},[])}function Cr({prop:e,defaultProp:t,onChange:r=()=>{}}){const[n,a]=Er({defaultProp:t,onChange:r}),o=e!==void 0,i=o?e:n,s=W(r),f=c.useCallback(d=>{if(o){const h=typeof d=="function"?d(e):d;h!==e&&s(h)}else a(d)},[o,e,a,s]);return[i,f]}function Er({defaultProp:e,onChange:t}){const r=c.useState(e),[n]=r,a=c.useRef(n),o=W(t);return c.useEffect(()=>{a.current!==n&&(o(n),a.current=n)},[n,a,o]),r}function Sr(e,t){return c.useReducer((r,n)=>t[r][n]??r,e)}var he=e=>{const{present:t,children:r}=e,n=Ar(t),a=typeof r=="function"?r({present:n.isPresent}):c.Children.only(r),o=U(n.ref,Nr(a));return typeof r=="function"||n.isPresent?c.cloneElement(a,{ref:o}):null};he.displayName="Presence";function Ar(e){const[t,r]=c.useState(),n=c.useRef({}),a=c.useRef(e),o=c.useRef("none"),i=e?"mounted":"unmounted",[s,f]=Sr(i,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return c.useEffect(()=>{const d=ne(n.current);o.current=s==="mounted"?d:"none"},[s]),de(()=>{const d=n.current,p=a.current;if(p!==e){const m=o.current,b=ne(d);e?f("MOUNT"):b==="none"||(d==null?void 0:d.display)==="none"?f("UNMOUNT"):f(p&&m!==b?"ANIMATION_OUT":"UNMOUNT"),a.current=e}},[e,f]),de(()=>{if(t){let d;const p=t.ownerDocument.defaultView??window,h=b=>{const u=ne(n.current).includes(b.animationName);if(b.target===t&&u&&(f("ANIMATION_END"),!a.current)){const y=t.style.animationFillMode;t.style.animationFillMode="forwards",d=p.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=y)})}},m=b=>{b.target===t&&(o.current=ne(n.current))};return t.addEventListener("animationstart",m),t.addEventListener("animationcancel",h),t.addEventListener("animationend",h),()=>{p.clearTimeout(d),t.removeEventListener("animationstart",m),t.removeEventListener("animationcancel",h),t.removeEventListener("animationend",h)}}else f("ANIMATION_END")},[t,f]),{isPresent:["mounted","unmountSuspended"].includes(s),ref:c.useCallback(d=>{d&&(n.current=getComputedStyle(d)),r(d)},[])}}function ne(e){return(e==null?void 0:e.animationName)||"none"}function Nr(e){var n,a;let t=(n=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:n.get,r=t&&"isReactWarning"in t&&t.isReactWarning;return r?e.ref:(t=(a=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:a.get,r=t&&"isReactWarning"in t&&t.isReactWarning,r?e.props.ref:e.props.ref||e.ref)}function ut(e){var t,r,n="";if(typeof e=="string"||typeof e=="number")n+=e;else if(typeof e=="object")if(Array.isArray(e)){var a=e.length;for(t=0;t<a;t++)e[t]&&(r=ut(e[t]))&&(n&&(n+=" "),n+=r)}else for(r in e)e[r]&&(n&&(n+=" "),n+=r);return n}function ft(){for(var e,t,r=0,n="",a=arguments.length;r<a;r++)(e=arguments[r])&&(t=ut(e))&&(n&&(n+=" "),n+=t);return n}const Te="-",Pr=e=>{const t=zr(e),{conflictingClassGroups:r,conflictingClassGroupModifiers:n}=e;return{getClassGroupId:i=>{const s=i.split(Te);return s[0]===""&&s.length!==1&&s.shift(),pt(s,t)||Rr(i)},getConflictingClassGroupIds:(i,s)=>{const f=r[i]||[];return s&&n[i]?[...f,...n[i]]:f}}},pt=(e,t)=>{var i;if(e.length===0)return t.classGroupId;const r=e[0],n=t.nextPart.get(r),a=n?pt(e.slice(1),n):void 0;if(a)return a;if(t.validators.length===0)return;const o=e.join(Te);return(i=t.validators.find(({validator:s})=>s(o)))==null?void 0:i.classGroupId},Ue=/^\[(.+)\]$/,Rr=e=>{if(Ue.test(e)){const t=Ue.exec(e)[1],r=t==null?void 0:t.substring(0,t.indexOf(":"));if(r)return"arbitrary.."+r}},zr=e=>{const{theme:t,prefix:r}=e,n={nextPart:new Map,validators:[]};return Or(Object.entries(e.classGroups),r).forEach(([o,i])=>{Oe(i,n,o,t)}),n},Oe=(e,t,r,n)=>{e.forEach(a=>{if(typeof a=="string"){const o=a===""?t:Ge(t,a);o.classGroupId=r;return}if(typeof a=="function"){if(jr(a)){Oe(a(n),t,r,n);return}t.validators.push({validator:a,classGroupId:r});return}Object.entries(a).forEach(([o,i])=>{Oe(i,Ge(t,o),r,n)})})},Ge=(e,t)=>{let r=e;return t.split(Te).forEach(n=>{r.nextPart.has(n)||r.nextPart.set(n,{nextPart:new Map,validators:[]}),r=r.nextPart.get(n)}),r},jr=e=>e.isThemeGetter,Or=(e,t)=>t?e.map(([r,n])=>{const a=n.map(o=>typeof o=="string"?t+o:typeof o=="object"?Object.fromEntries(Object.entries(o).map(([i,s])=>[t+i,s])):o);return[r,a]}):e,Lr=e=>{if(e<1)return{get:()=>{},set:()=>{}};let t=0,r=new Map,n=new Map;const a=(o,i)=>{r.set(o,i),t++,t>e&&(t=0,n=r,r=new Map)};return{get(o){let i=r.get(o);if(i!==void 0)return i;if((i=n.get(o))!==void 0)return a(o,i),i},set(o,i){r.has(o)?r.set(o,i):a(o,i)}}},ht="!",Dr=e=>{const{separator:t,experimentalParseClassName:r}=e,n=t.length===1,a=t[0],o=t.length,i=s=>{const f=[];let d=0,p=0,h;for(let y=0;y<s.length;y++){let g=s[y];if(d===0){if(g===a&&(n||s.slice(y,y+o)===t)){f.push(s.slice(p,y)),p=y+o;continue}if(g==="/"){h=y;continue}}g==="["?d++:g==="]"&&d--}const m=f.length===0?s:s.substring(p),b=m.startsWith(ht),x=b?m.substring(1):m,u=h&&h>p?h-p:void 0;return{modifiers:f,hasImportantModifier:b,baseClassName:x,maybePostfixModifierPosition:u}};return r?s=>r({className:s,parseClassName:i}):i},Tr=e=>{if(e.length<=1)return e;const t=[];let r=[];return e.forEach(n=>{n[0]==="["?(t.push(...r.sort(),n),r=[]):r.push(n)}),t.push(...r.sort()),t},_r=e=>({cache:Lr(e.cacheSize),parseClassName:Dr(e),...Pr(e)}),Ir=/\s+/,Fr=(e,t)=>{const{parseClassName:r,getClassGroupId:n,getConflictingClassGroupIds:a}=t,o=[],i=e.trim().split(Ir);let s="";for(let f=i.length-1;f>=0;f-=1){const d=i[f],{modifiers:p,hasImportantModifier:h,baseClassName:m,maybePostfixModifierPosition:b}=r(d);let x=!!b,u=n(x?m.substring(0,b):m);if(!u){if(!x){s=d+(s.length>0?" "+s:s);continue}if(u=n(m),!u){s=d+(s.length>0?" "+s:s);continue}x=!1}const y=Tr(p).join(":"),g=h?y+ht:y,w=g+u;if(o.includes(w))continue;o.push(w);const C=a(u,x);for(let M=0;M<C.length;++M){const S=C[M];o.push(g+S)}s=d+(s.length>0?" "+s:s)}return s};function Vr(){let e=0,t,r,n="";for(;e<arguments.length;)(t=arguments[e++])&&(r=yt(t))&&(n&&(n+=" "),n+=r);return n}const yt=e=>{if(typeof e=="string")return e;let t,r="";for(let n=0;n<e.length;n++)e[n]&&(t=yt(e[n]))&&(r&&(r+=" "),r+=t);return r};function qr(e,...t){let r,n,a,o=i;function i(f){const d=t.reduce((p,h)=>h(p),e());return r=_r(d),n=r.cache.get,a=r.cache.set,o=s,s(f)}function s(f){const d=n(f);if(d)return d;const p=Fr(f,r);return a(f,p),p}return function(){return o(Vr.apply(null,arguments))}}const A=e=>{const t=r=>r[e]||[];return t.isThemeGetter=!0,t},mt=/^\[(?:([a-z-]+):)?(.+)\]$/i,Hr=/^\d+\/\d+$/,Wr=new Set(["px","full","screen"]),Br=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Ur=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Gr=/^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,$r=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Kr=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,T=e=>X(e)||Wr.has(e)||Hr.test(e),I=e=>Y(e,"length",rn),X=e=>!!e&&!Number.isNaN(Number(e)),Me=e=>Y(e,"number",X),J=e=>!!e&&Number.isInteger(Number(e)),Xr=e=>e.endsWith("%")&&X(e.slice(0,-1)),k=e=>mt.test(e),F=e=>Br.test(e),Zr=new Set(["length","size","percentage"]),Yr=e=>Y(e,Zr,vt),Qr=e=>Y(e,"position",vt),Jr=new Set(["image","url"]),en=e=>Y(e,Jr,an),tn=e=>Y(e,"",nn),ee=()=>!0,Y=(e,t,r)=>{const n=mt.exec(e);return n?n[1]?typeof t=="string"?n[1]===t:t.has(n[1]):r(n[2]):!1},rn=e=>Ur.test(e)&&!Gr.test(e),vt=()=>!1,nn=e=>$r.test(e),an=e=>Kr.test(e),on=()=>{const e=A("colors"),t=A("spacing"),r=A("blur"),n=A("brightness"),a=A("borderColor"),o=A("borderRadius"),i=A("borderSpacing"),s=A("borderWidth"),f=A("contrast"),d=A("grayscale"),p=A("hueRotate"),h=A("invert"),m=A("gap"),b=A("gradientColorStops"),x=A("gradientColorStopPositions"),u=A("inset"),y=A("margin"),g=A("opacity"),w=A("padding"),C=A("saturate"),M=A("scale"),S=A("sepia"),P=A("skew"),E=A("space"),R=A("translate"),L=()=>["auto","contain","none"],H=()=>["auto","hidden","clip","visible","scroll"],ke=()=>["auto",k,t],N=()=>[k,t],qe=()=>["",T,I],te=()=>["auto",X,k],He=()=>["bottom","center","left","left-bottom","left-top","right","right-bottom","right-top","top"],re=()=>["solid","dashed","dotted","double","none"],We=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],xe=()=>["start","end","center","between","around","evenly","stretch"],Q=()=>["","0",k],Be=()=>["auto","avoid","all","avoid-page","page","left","right","column"],D=()=>[X,k];return{cacheSize:500,separator:":",theme:{colors:[ee],spacing:[T,I],blur:["none","",F,k],brightness:D(),borderColor:[e],borderRadius:["none","","full",F,k],borderSpacing:N(),borderWidth:qe(),contrast:D(),grayscale:Q(),hueRotate:D(),invert:Q(),gap:N(),gradientColorStops:[e],gradientColorStopPositions:[Xr,I],inset:ke(),margin:ke(),opacity:D(),padding:N(),saturate:D(),scale:D(),sepia:Q(),skew:D(),space:N(),translate:N()},classGroups:{aspect:[{aspect:["auto","square","video",k]}],container:["container"],columns:[{columns:[F]}],"break-after":[{"break-after":Be()}],"break-before":[{"break-before":Be()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:[...He(),k]}],overflow:[{overflow:H()}],"overflow-x":[{"overflow-x":H()}],"overflow-y":[{"overflow-y":H()}],overscroll:[{overscroll:L()}],"overscroll-x":[{"overscroll-x":L()}],"overscroll-y":[{"overscroll-y":L()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:[u]}],"inset-x":[{"inset-x":[u]}],"inset-y":[{"inset-y":[u]}],start:[{start:[u]}],end:[{end:[u]}],top:[{top:[u]}],right:[{right:[u]}],bottom:[{bottom:[u]}],left:[{left:[u]}],visibility:["visible","invisible","collapse"],z:[{z:["auto",J,k]}],basis:[{basis:ke()}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["wrap","wrap-reverse","nowrap"]}],flex:[{flex:["1","auto","initial","none",k]}],grow:[{grow:Q()}],shrink:[{shrink:Q()}],order:[{order:["first","last","none",J,k]}],"grid-cols":[{"grid-cols":[ee]}],"col-start-end":[{col:["auto",{span:["full",J,k]},k]}],"col-start":[{"col-start":te()}],"col-end":[{"col-end":te()}],"grid-rows":[{"grid-rows":[ee]}],"row-start-end":[{row:["auto",{span:[J,k]},k]}],"row-start":[{"row-start":te()}],"row-end":[{"row-end":te()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":["auto","min","max","fr",k]}],"auto-rows":[{"auto-rows":["auto","min","max","fr",k]}],gap:[{gap:[m]}],"gap-x":[{"gap-x":[m]}],"gap-y":[{"gap-y":[m]}],"justify-content":[{justify:["normal",...xe()]}],"justify-items":[{"justify-items":["start","end","center","stretch"]}],"justify-self":[{"justify-self":["auto","start","end","center","stretch"]}],"align-content":[{content:["normal",...xe(),"baseline"]}],"align-items":[{items:["start","end","center","baseline","stretch"]}],"align-self":[{self:["auto","start","end","center","stretch","baseline"]}],"place-content":[{"place-content":[...xe(),"baseline"]}],"place-items":[{"place-items":["start","end","center","baseline","stretch"]}],"place-self":[{"place-self":["auto","start","end","center","stretch"]}],p:[{p:[w]}],px:[{px:[w]}],py:[{py:[w]}],ps:[{ps:[w]}],pe:[{pe:[w]}],pt:[{pt:[w]}],pr:[{pr:[w]}],pb:[{pb:[w]}],pl:[{pl:[w]}],m:[{m:[y]}],mx:[{mx:[y]}],my:[{my:[y]}],ms:[{ms:[y]}],me:[{me:[y]}],mt:[{mt:[y]}],mr:[{mr:[y]}],mb:[{mb:[y]}],ml:[{ml:[y]}],"space-x":[{"space-x":[E]}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":[E]}],"space-y-reverse":["space-y-reverse"],w:[{w:["auto","min","max","fit","svw","lvw","dvw",k,t]}],"min-w":[{"min-w":[k,t,"min","max","fit"]}],"max-w":[{"max-w":[k,t,"none","full","min","max","fit","prose",{screen:[F]},F]}],h:[{h:[k,t,"auto","min","max","fit","svh","lvh","dvh"]}],"min-h":[{"min-h":[k,t,"min","max","fit","svh","lvh","dvh"]}],"max-h":[{"max-h":[k,t,"min","max","fit","svh","lvh","dvh"]}],size:[{size:[k,t,"auto","min","max","fit"]}],"font-size":[{text:["base",F,I]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:["thin","extralight","light","normal","medium","semibold","bold","extrabold","black",Me]}],"font-family":[{font:[ee]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractons"],tracking:[{tracking:["tighter","tight","normal","wide","wider","widest",k]}],"line-clamp":[{"line-clamp":["none",X,Me]}],leading:[{leading:["none","tight","snug","normal","relaxed","loose",T,k]}],"list-image":[{"list-image":["none",k]}],"list-style-type":[{list:["none","disc","decimal",k]}],"list-style-position":[{list:["inside","outside"]}],"placeholder-color":[{placeholder:[e]}],"placeholder-opacity":[{"placeholder-opacity":[g]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"text-color":[{text:[e]}],"text-opacity":[{"text-opacity":[g]}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...re(),"wavy"]}],"text-decoration-thickness":[{decoration:["auto","from-font",T,I]}],"underline-offset":[{"underline-offset":["auto",T,k]}],"text-decoration-color":[{decoration:[e]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:N()}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",k]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",k]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-opacity":[{"bg-opacity":[g]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:[...He(),Qr]}],"bg-repeat":[{bg:["no-repeat",{repeat:["","x","y","round","space"]}]}],"bg-size":[{bg:["auto","cover","contain",Yr]}],"bg-image":[{bg:["none",{"gradient-to":["t","tr","r","br","b","bl","l","tl"]},en]}],"bg-color":[{bg:[e]}],"gradient-from-pos":[{from:[x]}],"gradient-via-pos":[{via:[x]}],"gradient-to-pos":[{to:[x]}],"gradient-from":[{from:[b]}],"gradient-via":[{via:[b]}],"gradient-to":[{to:[b]}],rounded:[{rounded:[o]}],"rounded-s":[{"rounded-s":[o]}],"rounded-e":[{"rounded-e":[o]}],"rounded-t":[{"rounded-t":[o]}],"rounded-r":[{"rounded-r":[o]}],"rounded-b":[{"rounded-b":[o]}],"rounded-l":[{"rounded-l":[o]}],"rounded-ss":[{"rounded-ss":[o]}],"rounded-se":[{"rounded-se":[o]}],"rounded-ee":[{"rounded-ee":[o]}],"rounded-es":[{"rounded-es":[o]}],"rounded-tl":[{"rounded-tl":[o]}],"rounded-tr":[{"rounded-tr":[o]}],"rounded-br":[{"rounded-br":[o]}],"rounded-bl":[{"rounded-bl":[o]}],"border-w":[{border:[s]}],"border-w-x":[{"border-x":[s]}],"border-w-y":[{"border-y":[s]}],"border-w-s":[{"border-s":[s]}],"border-w-e":[{"border-e":[s]}],"border-w-t":[{"border-t":[s]}],"border-w-r":[{"border-r":[s]}],"border-w-b":[{"border-b":[s]}],"border-w-l":[{"border-l":[s]}],"border-opacity":[{"border-opacity":[g]}],"border-style":[{border:[...re(),"hidden"]}],"divide-x":[{"divide-x":[s]}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":[s]}],"divide-y-reverse":["divide-y-reverse"],"divide-opacity":[{"divide-opacity":[g]}],"divide-style":[{divide:re()}],"border-color":[{border:[a]}],"border-color-x":[{"border-x":[a]}],"border-color-y":[{"border-y":[a]}],"border-color-s":[{"border-s":[a]}],"border-color-e":[{"border-e":[a]}],"border-color-t":[{"border-t":[a]}],"border-color-r":[{"border-r":[a]}],"border-color-b":[{"border-b":[a]}],"border-color-l":[{"border-l":[a]}],"divide-color":[{divide:[a]}],"outline-style":[{outline:["",...re()]}],"outline-offset":[{"outline-offset":[T,k]}],"outline-w":[{outline:[T,I]}],"outline-color":[{outline:[e]}],"ring-w":[{ring:qe()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:[e]}],"ring-opacity":[{"ring-opacity":[g]}],"ring-offset-w":[{"ring-offset":[T,I]}],"ring-offset-color":[{"ring-offset":[e]}],shadow:[{shadow:["","inner","none",F,tn]}],"shadow-color":[{shadow:[ee]}],opacity:[{opacity:[g]}],"mix-blend":[{"mix-blend":[...We(),"plus-lighter","plus-darker"]}],"bg-blend":[{"bg-blend":We()}],filter:[{filter:["","none"]}],blur:[{blur:[r]}],brightness:[{brightness:[n]}],contrast:[{contrast:[f]}],"drop-shadow":[{"drop-shadow":["","none",F,k]}],grayscale:[{grayscale:[d]}],"hue-rotate":[{"hue-rotate":[p]}],invert:[{invert:[h]}],saturate:[{saturate:[C]}],sepia:[{sepia:[S]}],"backdrop-filter":[{"backdrop-filter":["","none"]}],"backdrop-blur":[{"backdrop-blur":[r]}],"backdrop-brightness":[{"backdrop-brightness":[n]}],"backdrop-contrast":[{"backdrop-contrast":[f]}],"backdrop-grayscale":[{"backdrop-grayscale":[d]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[p]}],"backdrop-invert":[{"backdrop-invert":[h]}],"backdrop-opacity":[{"backdrop-opacity":[g]}],"backdrop-saturate":[{"backdrop-saturate":[C]}],"backdrop-sepia":[{"backdrop-sepia":[S]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":[i]}],"border-spacing-x":[{"border-spacing-x":[i]}],"border-spacing-y":[{"border-spacing-y":[i]}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["none","all","","colors","opacity","shadow","transform",k]}],duration:[{duration:D()}],ease:[{ease:["linear","in","out","in-out",k]}],delay:[{delay:D()}],animate:[{animate:["none","spin","ping","pulse","bounce",k]}],transform:[{transform:["","gpu","none"]}],scale:[{scale:[M]}],"scale-x":[{"scale-x":[M]}],"scale-y":[{"scale-y":[M]}],rotate:[{rotate:[J,k]}],"translate-x":[{"translate-x":[R]}],"translate-y":[{"translate-y":[R]}],"skew-x":[{"skew-x":[P]}],"skew-y":[{"skew-y":[P]}],"transform-origin":[{origin:["center","top","top-right","right","bottom-right","bottom","bottom-left","left","top-left",k]}],accent:[{accent:["auto",e]}],appearance:[{appearance:["none","auto"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",k]}],"caret-color":[{caret:[e]}],"pointer-events":[{"pointer-events":["none","auto"]}],resize:[{resize:["none","y","x",""]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scroll-m":[{"scroll-m":N()}],"scroll-mx":[{"scroll-mx":N()}],"scroll-my":[{"scroll-my":N()}],"scroll-ms":[{"scroll-ms":N()}],"scroll-me":[{"scroll-me":N()}],"scroll-mt":[{"scroll-mt":N()}],"scroll-mr":[{"scroll-mr":N()}],"scroll-mb":[{"scroll-mb":N()}],"scroll-ml":[{"scroll-ml":N()}],"scroll-p":[{"scroll-p":N()}],"scroll-px":[{"scroll-px":N()}],"scroll-py":[{"scroll-py":N()}],"scroll-ps":[{"scroll-ps":N()}],"scroll-pe":[{"scroll-pe":N()}],"scroll-pt":[{"scroll-pt":N()}],"scroll-pr":[{"scroll-pr":N()}],"scroll-pb":[{"scroll-pb":N()}],"scroll-pl":[{"scroll-pl":N()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",k]}],fill:[{fill:[e,"none"]}],"stroke-w":[{stroke:[T,I,Me]}],stroke:[{stroke:[e,"none"]}],sr:["sr-only","not-sr-only"],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","start","end","top","right","bottom","left"],"inset-x":["right","left"],"inset-y":["top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pt","pr","pb","pl"],px:["pr","pl"],py:["pt","pb"],m:["mx","my","ms","me","mt","mr","mb","ml"],mx:["mr","ml"],my:["mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-s","border-w-e","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-r","border-w-l"],"border-w-y":["border-w-t","border-w-b"],"border-color":["border-color-s","border-color-e","border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-r","border-color-l"],"border-color-y":["border-color-t","border-color-b"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-mr","scroll-ml"],"scroll-my":["scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-pr","scroll-pl"],"scroll-py":["scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]}}},sn=qr(on);function z(...e){return sn(ft(e))}const $e=e=>typeof e=="boolean"?`${e}`:e===0?"0":e,Ke=ft,gt=(e,t)=>r=>{var n;if((t==null?void 0:t.variants)==null)return Ke(e,r==null?void 0:r.class,r==null?void 0:r.className);const{variants:a,defaultVariants:o}=t,i=Object.keys(a).map(d=>{const p=r==null?void 0:r[d],h=o==null?void 0:o[d];if(p===null)return null;const m=$e(p)||$e(h);return a[d][m]}),s=r&&Object.entries(r).reduce((d,p)=>{let[h,m]=p;return m===void 0||(d[h]=m),d},{}),f=t==null||(n=t.compoundVariants)===null||n===void 0?void 0:n.reduce((d,p)=>{let{class:h,className:m,...b}=p;return Object.entries(b).every(x=>{let[u,y]=x;return Array.isArray(y)?y.includes({...o,...s}[u]):{...o,...s}[u]===y})?[...d,h,m]:d},[]);return Ke(e,i,f,r==null?void 0:r.class,r==null?void 0:r.className)},cn=gt("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),ln=c.forwardRef(({className:e,variant:t,size:r,asChild:n=!1,...a},o)=>{const i=n?pe:"button";return v.jsx(i,{className:z(cn({variant:t,size:r,className:e})),ref:o,...a})});ln.displayName="Button";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),bt=(...e)=>e.filter((t,r,n)=>!!t&&t.trim()!==""&&n.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var un={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=c.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:a="",children:o,iconNode:i,...s},f)=>c.createElement("svg",{ref:f,...un,width:t,height:t,stroke:e,strokeWidth:n?Number(r)*24/Number(t):r,className:bt("lucide",a),...s},[...i.map(([d,p])=>c.createElement(d,p)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=(e,t)=>{const r=c.forwardRef(({className:n,...a},o)=>c.createElement(fn,{ref:o,iconNode:t,className:bt(`lucide-${dn(e)}`,n),...a}));return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=l("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=l("ArrowDownLeft",[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=l("ArrowDownNarrowWide",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"M11 4h4",key:"6d7r33"}],["path",{d:"M11 8h7",key:"djye34"}],["path",{d:"M11 12h10",key:"1438ji"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=l("ArrowDownUp",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=l("ArrowDownWideNarrow",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"M11 4h10",key:"1w87gc"}],["path",{d:"M11 8h7",key:"djye34"}],["path",{d:"M11 12h4",key:"q8tih4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=l("ArrowDown",[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=l("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=l("ArrowRightLeft",[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=l("ArrowUpNarrowWide",[["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}],["path",{d:"M11 12h4",key:"q8tih4"}],["path",{d:"M11 16h7",key:"uosisv"}],["path",{d:"M11 20h10",key:"jvxblo"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=l("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=l("AtSign",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8",key:"7n84p3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=l("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=l("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=l("Bitcoin",[["path",{d:"M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727",key:"yr8idg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=l("Blocks",[["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["path",{d:"M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3",key:"1fpvtg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eo=l("Bold",[["path",{d:"M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",key:"mg9rjx"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const to=l("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ro=l("Bug",[["path",{d:"m8 2 1.88 1.88",key:"fmnt4t"}],["path",{d:"M14.12 3.88 16 2",key:"qol33r"}],["path",{d:"M9 7.13v-1a3.003 3.003 0 1 1 6 0v1",key:"d7y7pr"}],["path",{d:"M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6",key:"xs1cw7"}],["path",{d:"M12 20v-9",key:"1qisl0"}],["path",{d:"M6.53 9C4.6 8.8 3 7.1 3 5",key:"32zzws"}],["path",{d:"M6 13H2",key:"82j7cp"}],["path",{d:"M3 21c0-2.1 1.7-3.9 3.8-4",key:"4p0ekp"}],["path",{d:"M20.97 5c0 2.1-1.6 3.8-3.5 4",key:"18gb23"}],["path",{d:"M22 13h-4",key:"1jl80f"}],["path",{d:"M17.2 17c2.1.1 3.8 1.9 3.8 4",key:"k3fwyw"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const no=l("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ao=l("ChartLine",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oo=l("CheckCheck",[["path",{d:"M18 6 7 17l-5-5",key:"116fxf"}],["path",{d:"m22 10-7.5 7.5L13 16",key:"ke71qq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const so=l("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const io=l("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const co=l("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lo=l("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uo=l("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fo=l("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const po=l("CircleCheckBig",[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ho=l("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yo=l("CircleHelp",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mo=l("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vo=l("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const go=l("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bo=l("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ko=l("Code",[["polyline",{points:"16 18 22 12 16 6",key:"z7tu5w"}],["polyline",{points:"8 6 2 12 8 18",key:"1eg1df"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xo=l("Coins",[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wo=l("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mo=l("Crown",[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Co=l("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eo=l("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const So=l("Dot",[["circle",{cx:"12.1",cy:"12.1",r:"1",key:"18d7e5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ao=l("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const No=l("EllipsisVertical",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Po=l("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ro=l("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zo=l("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jo=l("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oo=l("FileCode",[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lo=l("FilePen",[["path",{d:"M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5",key:"1couwa"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",key:"1y4qbx"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Do=l("FileQuestion",[["path",{d:"M12 17h.01",key:"p32p05"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}],["path",{d:"M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3",key:"mhlwft"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const To=l("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _o=l("Fingerprint",[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Io=l("Flag",[["path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",key:"i9b6wo"}],["line",{x1:"4",x2:"4",y1:"22",y2:"15",key:"1cm3nv"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fo=l("Fuel",[["line",{x1:"3",x2:"15",y1:"22",y2:"22",key:"xegly4"}],["line",{x1:"4",x2:"14",y1:"9",y2:"9",key:"xcnuvu"}],["path",{d:"M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18",key:"16j0yd"}],["path",{d:"M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5",key:"7cu91f"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vo=l("Gamepad2",[["line",{x1:"6",x2:"10",y1:"11",y2:"11",key:"1gktln"}],["line",{x1:"8",x2:"8",y1:"9",y2:"13",key:"qnk9ow"}],["line",{x1:"15",x2:"15.01",y1:"12",y2:"12",key:"krot7o"}],["line",{x1:"18",x2:"18.01",y1:"10",y2:"10",key:"1lcuu1"}],["path",{d:"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z",key:"mfqc10"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qo=l("Github",[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ho=l("Grid2x2",[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 12h18",key:"1i2n21"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wo=l("Grid3x3",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bo=l("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uo=l("Heading1",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Go=l("Heading2",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $o=l("Heading3",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2",key:"68ncm8"}],["path",{d:"M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2",key:"1ejuhz"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ko=l("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xo=l("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zo=l("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yo=l("ImageOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M10.41 10.41a2 2 0 1 1-2.83-2.83",key:"1bzlo9"}],["line",{x1:"13.5",x2:"6",y1:"13.5",y2:"21",key:"1q0aeu"}],["line",{x1:"18",x2:"21",y1:"12",y2:"15",key:"5mozeu"}],["path",{d:"M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59",key:"mmje98"}],["path",{d:"M21 15V5a2 2 0 0 0-2-2H9",key:"43el77"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qo=l("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jo=l("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=l("Italic",[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=l("KeyRound",[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=l("Keyboard",[["path",{d:"M10 8h.01",key:"1r9ogq"}],["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M14 8h.01",key:"1primd"}],["path",{d:"M16 12h.01",key:"1l6xoz"}],["path",{d:"M18 8h.01",key:"emo2bl"}],["path",{d:"M6 8h.01",key:"x9i8wu"}],["path",{d:"M7 16h10",key:"wp8him"}],["path",{d:"M8 12h.01",key:"czm47f"}],["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=l("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=l("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=l("ListOrdered",[["path",{d:"M10 12h11",key:"6m4ad9"}],["path",{d:"M10 18h11",key:"11hvi2"}],["path",{d:"M10 6h11",key:"c7qv1k"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=l("List",[["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 18h.01",key:"1tta3j"}],["path",{d:"M3 6h.01",key:"1rqtza"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 18h13",key:"1lx6n3"}],["path",{d:"M8 6h13",key:"ik3vkj"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=l("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=l("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=l("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=l("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=l("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=l("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=l("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=l("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=l("MessageSquarePlus",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["path",{d:"M12 7v6",key:"lw1j43"}],["path",{d:"M9 10h6",key:"9gxzsh"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=l("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=l("Minimize2",[["polyline",{points:"4 14 10 14 10 20",key:"11kfnr"}],["polyline",{points:"20 10 14 10 14 4",key:"rlmsce"}],["line",{x1:"14",x2:"21",y1:"10",y2:"3",key:"o5lafz"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=l("Network",[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=l("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=l("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=l("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=l("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=l("QrCode",[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=l("Quote",[["path",{d:"M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"rib7q0"}],["path",{d:"M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"1ymkrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=l("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=l("Rocket",[["path",{d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",key:"m3kijz"}],["path",{d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",key:"1fmvmk"}],["path",{d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",key:"1f8sc4"}],["path",{d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",key:"qeys4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=l("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=l("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=l("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rs=l("SendHorizontal",[["path",{d:"M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z",key:"117uat"}],["path",{d:"M6 12h16",key:"s4cdu5"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zs=l("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=l("Server",[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=l("Settings2",[["path",{d:"M20 7h-9",key:"3s1dr2"}],["path",{d:"M14 17H5",key:"gfn3mx"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ls=l("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ds=l("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ts=l("Share",[["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}],["polyline",{points:"16 6 12 2 8 6",key:"m901s6"}],["line",{x1:"12",x2:"12",y1:"2",y2:"15",key:"1p0rca"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _s=l("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Is=l("SmilePlus",[["path",{d:"M22 11v1a10 10 0 1 1-9-10",key:"ew0xw9"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}],["path",{d:"M16 5h6",key:"1vod17"}],["path",{d:"M19 2v6",key:"4bpg5p"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=l("Smile",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vs=l("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qs=l("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hs=l("Star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ws=l("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bs=l("Trash",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Us=l("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gs=l("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $s=l("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ks=l("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xs=l("UserCheck",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["polyline",{points:"16 11 18 13 22 9",key:"1pwet4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zs=l("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ys=l("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qs=l("UserX",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Js=l("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ei=l("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ti=l("Volume2",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ri=l("Wallet",[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ni=l("WifiOff",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ai=l("Wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=l("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oi=l("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);function pn(e,t=globalThis==null?void 0:globalThis.document){const r=W(e);c.useEffect(()=>{const n=a=>{a.key==="Escape"&&r(a)};return t.addEventListener("keydown",n,{capture:!0}),()=>t.removeEventListener("keydown",n,{capture:!0})},[r,t])}var hn="DismissableLayer",Le="dismissableLayer.update",yn="dismissableLayer.pointerDownOutside",mn="dismissableLayer.focusOutside",Xe,xt=c.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),wt=c.forwardRef((e,t)=>{const{disableOutsidePointerEvents:r=!1,onEscapeKeyDown:n,onPointerDownOutside:a,onFocusOutside:o,onInteractOutside:i,onDismiss:s,...f}=e,d=c.useContext(xt),[p,h]=c.useState(null),m=(p==null?void 0:p.ownerDocument)??(globalThis==null?void 0:globalThis.document),[,b]=c.useState({}),x=U(t,E=>h(E)),u=Array.from(d.layers),[y]=[...d.layersWithOutsidePointerEventsDisabled].slice(-1),g=u.indexOf(y),w=p?u.indexOf(p):-1,C=d.layersWithOutsidePointerEventsDisabled.size>0,M=w>=g,S=bn(E=>{const R=E.target,L=[...d.branches].some(H=>H.contains(R));!M||L||(a==null||a(E),i==null||i(E),E.defaultPrevented||s==null||s())},m),P=kn(E=>{const R=E.target;[...d.branches].some(H=>H.contains(R))||(o==null||o(E),i==null||i(E),E.defaultPrevented||s==null||s())},m);return pn(E=>{w===d.layers.size-1&&(n==null||n(E),!E.defaultPrevented&&s&&(E.preventDefault(),s()))},m),c.useEffect(()=>{if(p)return r&&(d.layersWithOutsidePointerEventsDisabled.size===0&&(Xe=m.body.style.pointerEvents,m.body.style.pointerEvents="none"),d.layersWithOutsidePointerEventsDisabled.add(p)),d.layers.add(p),Ze(),()=>{r&&d.layersWithOutsidePointerEventsDisabled.size===1&&(m.body.style.pointerEvents=Xe)}},[p,m,r,d]),c.useEffect(()=>()=>{p&&(d.layers.delete(p),d.layersWithOutsidePointerEventsDisabled.delete(p),Ze())},[p,d]),c.useEffect(()=>{const E=()=>b({});return document.addEventListener(Le,E),()=>document.removeEventListener(Le,E)},[]),v.jsx(_.div,{...f,ref:x,style:{pointerEvents:C?M?"auto":"none":void 0,...e.style},onFocusCapture:q(e.onFocusCapture,P.onFocusCapture),onBlurCapture:q(e.onBlurCapture,P.onBlurCapture),onPointerDownCapture:q(e.onPointerDownCapture,S.onPointerDownCapture)})});wt.displayName=hn;var vn="DismissableLayerBranch",gn=c.forwardRef((e,t)=>{const r=c.useContext(xt),n=c.useRef(null),a=U(t,n);return c.useEffect(()=>{const o=n.current;if(o)return r.branches.add(o),()=>{r.branches.delete(o)}},[r.branches]),v.jsx(_.div,{...e,ref:a})});gn.displayName=vn;function bn(e,t=globalThis==null?void 0:globalThis.document){const r=W(e),n=c.useRef(!1),a=c.useRef(()=>{});return c.useEffect(()=>{const o=s=>{if(s.target&&!n.current){let f=function(){Mt(yn,r,d,{discrete:!0})};const d={originalEvent:s};s.pointerType==="touch"?(t.removeEventListener("click",a.current),a.current=f,t.addEventListener("click",a.current,{once:!0})):f()}else t.removeEventListener("click",a.current);n.current=!1},i=window.setTimeout(()=>{t.addEventListener("pointerdown",o)},0);return()=>{window.clearTimeout(i),t.removeEventListener("pointerdown",o),t.removeEventListener("click",a.current)}},[t,r]),{onPointerDownCapture:()=>n.current=!0}}function kn(e,t=globalThis==null?void 0:globalThis.document){const r=W(e),n=c.useRef(!1);return c.useEffect(()=>{const a=o=>{o.target&&!n.current&&Mt(mn,r,{originalEvent:o},{discrete:!1})};return t.addEventListener("focusin",a),()=>t.removeEventListener("focusin",a)},[t,r]),{onFocusCapture:()=>n.current=!0,onBlurCapture:()=>n.current=!1}}function Ze(){const e=new CustomEvent(Le);document.dispatchEvent(e)}function Mt(e,t,r,{discrete:n}){const a=r.originalEvent.target,o=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:r});t&&a.addEventListener(e,t,{once:!0}),n?Mr(a,o):a.dispatchEvent(o)}var Ce="focusScope.autoFocusOnMount",Ee="focusScope.autoFocusOnUnmount",Ye={bubbles:!1,cancelable:!0},xn="FocusScope",Ct=c.forwardRef((e,t)=>{const{loop:r=!1,trapped:n=!1,onMountAutoFocus:a,onUnmountAutoFocus:o,...i}=e,[s,f]=c.useState(null),d=W(a),p=W(o),h=c.useRef(null),m=U(t,u=>f(u)),b=c.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;c.useEffect(()=>{if(n){let u=function(C){if(b.paused||!s)return;const M=C.target;s.contains(M)?h.current=M:V(h.current,{select:!0})},y=function(C){if(b.paused||!s)return;const M=C.relatedTarget;M!==null&&(s.contains(M)||V(h.current,{select:!0}))},g=function(C){if(document.activeElement===document.body)for(const S of C)S.removedNodes.length>0&&V(s)};document.addEventListener("focusin",u),document.addEventListener("focusout",y);const w=new MutationObserver(g);return s&&w.observe(s,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",u),document.removeEventListener("focusout",y),w.disconnect()}}},[n,s,b.paused]),c.useEffect(()=>{if(s){Je.add(b);const u=document.activeElement;if(!s.contains(u)){const g=new CustomEvent(Ce,Ye);s.addEventListener(Ce,d),s.dispatchEvent(g),g.defaultPrevented||(wn(An(Et(s)),{select:!0}),document.activeElement===u&&V(s))}return()=>{s.removeEventListener(Ce,d),setTimeout(()=>{const g=new CustomEvent(Ee,Ye);s.addEventListener(Ee,p),s.dispatchEvent(g),g.defaultPrevented||V(u??document.body,{select:!0}),s.removeEventListener(Ee,p),Je.remove(b)},0)}}},[s,d,p,b]);const x=c.useCallback(u=>{if(!r&&!n||b.paused)return;const y=u.key==="Tab"&&!u.altKey&&!u.ctrlKey&&!u.metaKey,g=document.activeElement;if(y&&g){const w=u.currentTarget,[C,M]=Mn(w);C&&M?!u.shiftKey&&g===M?(u.preventDefault(),r&&V(C,{select:!0})):u.shiftKey&&g===C&&(u.preventDefault(),r&&V(M,{select:!0})):g===w&&u.preventDefault()}},[r,n,b.paused]);return v.jsx(_.div,{tabIndex:-1,...i,ref:m,onKeyDown:x})});Ct.displayName=xn;function wn(e,{select:t=!1}={}){const r=document.activeElement;for(const n of e)if(V(n,{select:t}),document.activeElement!==r)return}function Mn(e){const t=Et(e),r=Qe(t,e),n=Qe(t.reverse(),e);return[r,n]}function Et(e){const t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:n=>{const a=n.tagName==="INPUT"&&n.type==="hidden";return n.disabled||n.hidden||a?NodeFilter.FILTER_SKIP:n.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;r.nextNode();)t.push(r.currentNode);return t}function Qe(e,t){for(const r of e)if(!Cn(r,{upTo:t}))return r}function Cn(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function En(e){return e instanceof HTMLInputElement&&"select"in e}function V(e,{select:t=!1}={}){if(e&&e.focus){const r=document.activeElement;e.focus({preventScroll:!0}),e!==r&&En(e)&&t&&e.select()}}var Je=Sn();function Sn(){let e=[];return{add(t){const r=e[0];t!==r&&(r==null||r.pause()),e=et(e,t),e.unshift(t)},remove(t){var r;e=et(e,t),(r=e[0])==null||r.resume()}}}function et(e,t){const r=[...e],n=r.indexOf(t);return n!==-1&&r.splice(n,1),r}function An(e){return e.filter(t=>t.tagName!=="A")}var Nn="Portal",St=c.forwardRef((e,t)=>{var s;const{container:r,...n}=e,[a,o]=c.useState(!1);de(()=>o(!0),[]);const i=r||a&&((s=globalThis==null?void 0:globalThis.document)==null?void 0:s.body);return i?ar.createPortal(v.jsx(_.div,{...n,ref:t}),i):null});St.displayName=Nn;var Se=0;function Pn(){c.useEffect(()=>{const e=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",e[0]??tt()),document.body.insertAdjacentElement("beforeend",e[1]??tt()),Se++,()=>{Se===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(t=>t.remove()),Se--}},[])}function tt(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}var ce="right-scroll-bar-position",le="width-before-scroll-bar",Rn="with-scroll-bars-hidden",zn="--removed-body-scroll-bar-size";function Ae(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function jn(e,t){var r=c.useState(function(){return{value:e,callback:t,facade:{get current(){return r.value},set current(n){var a=r.value;a!==n&&(r.value=n,r.callback(n,a))}}}})[0];return r.callback=t,r.facade}var On=typeof window<"u"?c.useLayoutEffect:c.useEffect,rt=new WeakMap;function Ln(e,t){var r=jn(null,function(n){return e.forEach(function(a){return Ae(a,n)})});return On(function(){var n=rt.get(r);if(n){var a=new Set(n),o=new Set(e),i=r.current;a.forEach(function(s){o.has(s)||Ae(s,null)}),o.forEach(function(s){a.has(s)||Ae(s,i)})}rt.set(r,e)},[e]),r}function Dn(e){return e}function Tn(e,t){t===void 0&&(t=Dn);var r=[],n=!1,a={read:function(){if(n)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return r.length?r[r.length-1]:e},useMedium:function(o){var i=t(o,n);return r.push(i),function(){r=r.filter(function(s){return s!==i})}},assignSyncMedium:function(o){for(n=!0;r.length;){var i=r;r=[],i.forEach(o)}r={push:function(s){return o(s)},filter:function(){return r}}},assignMedium:function(o){n=!0;var i=[];if(r.length){var s=r;r=[],s.forEach(o),i=r}var f=function(){var p=i;i=[],p.forEach(o)},d=function(){return Promise.resolve().then(f)};d(),r={push:function(p){i.push(p),d()},filter:function(p){return i=i.filter(p),r}}}};return a}function _n(e){e===void 0&&(e={});var t=Tn(null);return t.options=O({async:!0,ssr:!1},e),t}var At=function(e){var t=e.sideCar,r=lt(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var n=t.read();if(!n)throw new Error("Sidecar medium not found");return c.createElement(n,O({},r))};At.isSideCarExport=!0;function In(e,t){return e.useMedium(t),At}var Nt=_n(),Ne=function(){},ye=c.forwardRef(function(e,t){var r=c.useRef(null),n=c.useState({onScrollCapture:Ne,onWheelCapture:Ne,onTouchMoveCapture:Ne}),a=n[0],o=n[1],i=e.forwardProps,s=e.children,f=e.className,d=e.removeScrollBar,p=e.enabled,h=e.shards,m=e.sideCar,b=e.noIsolation,x=e.inert,u=e.allowPinchZoom,y=e.as,g=y===void 0?"div":y,w=e.gapMode,C=lt(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noIsolation","inert","allowPinchZoom","as","gapMode"]),M=m,S=Ln([r,t]),P=O(O({},C),a);return c.createElement(c.Fragment,null,p&&c.createElement(M,{sideCar:Nt,removeScrollBar:d,shards:h,noIsolation:b,inert:x,setCallbacks:o,allowPinchZoom:!!u,lockRef:r,gapMode:w}),i?c.cloneElement(c.Children.only(s),O(O({},P),{ref:S})):c.createElement(g,O({},P,{className:f,ref:S}),s))});ye.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};ye.classNames={fullWidth:le,zeroRight:ce};var Fn=function(){if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function Vn(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=Fn();return t&&e.setAttribute("nonce",t),e}function qn(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function Hn(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var Wn=function(){var e=0,t=null;return{add:function(r){e==0&&(t=Vn())&&(qn(t,r),Hn(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Bn=function(){var e=Wn();return function(t,r){c.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&r])}},Pt=function(){var e=Bn(),t=function(r){var n=r.styles,a=r.dynamic;return e(n,a),null};return t},Un={left:0,top:0,right:0,gap:0},Pe=function(e){return parseInt(e||"",10)||0},Gn=function(e){var t=window.getComputedStyle(document.body),r=t[e==="padding"?"paddingLeft":"marginLeft"],n=t[e==="padding"?"paddingTop":"marginTop"],a=t[e==="padding"?"paddingRight":"marginRight"];return[Pe(r),Pe(n),Pe(a)]},$n=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return Un;var t=Gn(e),r=document.documentElement.clientWidth,n=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,n-r+t[2]-t[0])}},Kn=Pt(),Z="data-scroll-locked",Xn=function(e,t,r,n){var a=e.left,o=e.top,i=e.right,s=e.gap;return r===void 0&&(r="margin"),`
  .`.concat(Rn,` {
   overflow: hidden `).concat(n,`;
   padding-right: `).concat(s,"px ").concat(n,`;
  }
  body[`).concat(Z,`] {
    overflow: hidden `).concat(n,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(n,";"),r==="margin"&&`
    padding-left: `.concat(a,`px;
    padding-top: `).concat(o,`px;
    padding-right: `).concat(i,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s,"px ").concat(n,`;
    `),r==="padding"&&"padding-right: ".concat(s,"px ").concat(n,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(ce,` {
    right: `).concat(s,"px ").concat(n,`;
  }
  
  .`).concat(le,` {
    margin-right: `).concat(s,"px ").concat(n,`;
  }
  
  .`).concat(ce," .").concat(ce,` {
    right: 0 `).concat(n,`;
  }
  
  .`).concat(le," .").concat(le,` {
    margin-right: 0 `).concat(n,`;
  }
  
  body[`).concat(Z,`] {
    `).concat(zn,": ").concat(s,`px;
  }
`)},nt=function(){var e=parseInt(document.body.getAttribute(Z)||"0",10);return isFinite(e)?e:0},Zn=function(){c.useEffect(function(){return document.body.setAttribute(Z,(nt()+1).toString()),function(){var e=nt()-1;e<=0?document.body.removeAttribute(Z):document.body.setAttribute(Z,e.toString())}},[])},Yn=function(e){var t=e.noRelative,r=e.noImportant,n=e.gapMode,a=n===void 0?"margin":n;Zn();var o=c.useMemo(function(){return $n(a)},[a]);return c.createElement(Kn,{styles:Xn(o,!t,a,r?"":"!important")})},De=!1;if(typeof window<"u")try{var ae=Object.defineProperty({},"passive",{get:function(){return De=!0,!0}});window.addEventListener("test",ae,ae),window.removeEventListener("test",ae,ae)}catch{De=!1}var G=De?{passive:!1}:!1,Qn=function(e){return e.tagName==="TEXTAREA"},Rt=function(e,t){if(!(e instanceof Element))return!1;var r=window.getComputedStyle(e);return r[t]!=="hidden"&&!(r.overflowY===r.overflowX&&!Qn(e)&&r[t]==="visible")},Jn=function(e){return Rt(e,"overflowY")},ea=function(e){return Rt(e,"overflowX")},at=function(e,t){var r=t.ownerDocument,n=t;do{typeof ShadowRoot<"u"&&n instanceof ShadowRoot&&(n=n.host);var a=zt(e,n);if(a){var o=jt(e,n),i=o[1],s=o[2];if(i>s)return!0}n=n.parentNode}while(n&&n!==r.body);return!1},ta=function(e){var t=e.scrollTop,r=e.scrollHeight,n=e.clientHeight;return[t,r,n]},ra=function(e){var t=e.scrollLeft,r=e.scrollWidth,n=e.clientWidth;return[t,r,n]},zt=function(e,t){return e==="v"?Jn(t):ea(t)},jt=function(e,t){return e==="v"?ta(t):ra(t)},na=function(e,t){return e==="h"&&t==="rtl"?-1:1},aa=function(e,t,r,n,a){var o=na(e,window.getComputedStyle(t).direction),i=o*n,s=r.target,f=t.contains(s),d=!1,p=i>0,h=0,m=0;do{var b=jt(e,s),x=b[0],u=b[1],y=b[2],g=u-y-o*x;(x||g)&&zt(e,s)&&(h+=g,m+=x),s instanceof ShadowRoot?s=s.host:s=s.parentNode}while(!f&&s!==document.body||f&&(t.contains(s)||t===s));return(p&&(Math.abs(h)<1||!a)||!p&&(Math.abs(m)<1||!a))&&(d=!0),d},oe=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},ot=function(e){return[e.deltaX,e.deltaY]},st=function(e){return e&&"current"in e?e.current:e},oa=function(e,t){return e[0]===t[0]&&e[1]===t[1]},sa=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},ia=0,$=[];function ca(e){var t=c.useRef([]),r=c.useRef([0,0]),n=c.useRef(),a=c.useState(ia++)[0],o=c.useState(Pt)[0],i=c.useRef(e);c.useEffect(function(){i.current=e},[e]),c.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(a));var u=ur([e.lockRef.current],(e.shards||[]).map(st),!0).filter(Boolean);return u.forEach(function(y){return y.classList.add("allow-interactivity-".concat(a))}),function(){document.body.classList.remove("block-interactivity-".concat(a)),u.forEach(function(y){return y.classList.remove("allow-interactivity-".concat(a))})}}},[e.inert,e.lockRef.current,e.shards]);var s=c.useCallback(function(u,y){if("touches"in u&&u.touches.length===2||u.type==="wheel"&&u.ctrlKey)return!i.current.allowPinchZoom;var g=oe(u),w=r.current,C="deltaX"in u?u.deltaX:w[0]-g[0],M="deltaY"in u?u.deltaY:w[1]-g[1],S,P=u.target,E=Math.abs(C)>Math.abs(M)?"h":"v";if("touches"in u&&E==="h"&&P.type==="range")return!1;var R=at(E,P);if(!R)return!0;if(R?S=E:(S=E==="v"?"h":"v",R=at(E,P)),!R)return!1;if(!n.current&&"changedTouches"in u&&(C||M)&&(n.current=S),!S)return!0;var L=n.current||S;return aa(L,y,u,L==="h"?C:M,!0)},[]),f=c.useCallback(function(u){var y=u;if(!(!$.length||$[$.length-1]!==o)){var g="deltaY"in y?ot(y):oe(y),w=t.current.filter(function(S){return S.name===y.type&&(S.target===y.target||y.target===S.shadowParent)&&oa(S.delta,g)})[0];if(w&&w.should){y.cancelable&&y.preventDefault();return}if(!w){var C=(i.current.shards||[]).map(st).filter(Boolean).filter(function(S){return S.contains(y.target)}),M=C.length>0?s(y,C[0]):!i.current.noIsolation;M&&y.cancelable&&y.preventDefault()}}},[]),d=c.useCallback(function(u,y,g,w){var C={name:u,delta:y,target:g,should:w,shadowParent:la(g)};t.current.push(C),setTimeout(function(){t.current=t.current.filter(function(M){return M!==C})},1)},[]),p=c.useCallback(function(u){r.current=oe(u),n.current=void 0},[]),h=c.useCallback(function(u){d(u.type,ot(u),u.target,s(u,e.lockRef.current))},[]),m=c.useCallback(function(u){d(u.type,oe(u),u.target,s(u,e.lockRef.current))},[]);c.useEffect(function(){return $.push(o),e.setCallbacks({onScrollCapture:h,onWheelCapture:h,onTouchMoveCapture:m}),document.addEventListener("wheel",f,G),document.addEventListener("touchmove",f,G),document.addEventListener("touchstart",p,G),function(){$=$.filter(function(u){return u!==o}),document.removeEventListener("wheel",f,G),document.removeEventListener("touchmove",f,G),document.removeEventListener("touchstart",p,G)}},[]);var b=e.removeScrollBar,x=e.inert;return c.createElement(c.Fragment,null,x?c.createElement(o,{styles:sa(a)}):null,b?c.createElement(Yn,{gapMode:e.gapMode}):null)}function la(e){for(var t=null;e!==null;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}const da=In(Nt,ca);var Ot=c.forwardRef(function(e,t){return c.createElement(ye,O({},e,{ref:t,sideCar:da}))});Ot.classNames=ye.classNames;var ua=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},K=new WeakMap,se=new WeakMap,ie={},Re=0,Lt=function(e){return e&&(e.host||Lt(e.parentNode))},fa=function(e,t){return t.map(function(r){if(e.contains(r))return r;var n=Lt(r);return n&&e.contains(n)?n:(console.error("aria-hidden",r,"in not contained inside",e,". Doing nothing"),null)}).filter(function(r){return!!r})},pa=function(e,t,r,n){var a=fa(t,Array.isArray(e)?e:[e]);ie[r]||(ie[r]=new WeakMap);var o=ie[r],i=[],s=new Set,f=new Set(a),d=function(h){!h||s.has(h)||(s.add(h),d(h.parentNode))};a.forEach(d);var p=function(h){!h||f.has(h)||Array.prototype.forEach.call(h.children,function(m){if(s.has(m))p(m);else try{var b=m.getAttribute(n),x=b!==null&&b!=="false",u=(K.get(m)||0)+1,y=(o.get(m)||0)+1;K.set(m,u),o.set(m,y),i.push(m),u===1&&x&&se.set(m,!0),y===1&&m.setAttribute(r,"true"),x||m.setAttribute(n,"true")}catch(g){console.error("aria-hidden: cannot operate on ",m,g)}})};return p(t),s.clear(),Re++,function(){i.forEach(function(h){var m=K.get(h)-1,b=o.get(h)-1;K.set(h,m),o.set(h,b),m||(se.has(h)||h.removeAttribute(n),se.delete(h)),b||h.removeAttribute(r)}),Re--,Re||(K=new WeakMap,K=new WeakMap,se=new WeakMap,ie={})}},ha=function(e,t,r){r===void 0&&(r="data-aria-hidden");var n=Array.from(Array.isArray(e)?e:[e]),a=ua(e);return a?(n.push.apply(n,Array.from(a.querySelectorAll("[aria-live]"))),pa(n,a,r,"aria-hidden")):function(){return null}},_e="Dialog",[Dt,si]=pr(_e),[ya,j]=Dt(_e),Tt=e=>{const{__scopeDialog:t,children:r,open:n,defaultOpen:a,onOpenChange:o,modal:i=!0}=e,s=c.useRef(null),f=c.useRef(null),[d=!1,p]=Cr({prop:n,defaultProp:a,onChange:o});return v.jsx(ya,{scope:t,triggerRef:s,contentRef:f,contentId:we(),titleId:we(),descriptionId:we(),open:d,onOpenChange:p,onOpenToggle:c.useCallback(()=>p(h=>!h),[p]),modal:i,children:r})};Tt.displayName=_e;var _t="DialogTrigger",It=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,a=j(_t,r),o=U(t,a.triggerRef);return v.jsx(_.button,{type:"button","aria-haspopup":"dialog","aria-expanded":a.open,"aria-controls":a.contentId,"data-state":Ve(a.open),...n,ref:o,onClick:q(e.onClick,a.onOpenToggle)})});It.displayName=_t;var Ie="DialogPortal",[ma,Ft]=Dt(Ie,{forceMount:void 0}),Vt=e=>{const{__scopeDialog:t,forceMount:r,children:n,container:a}=e,o=j(Ie,t);return v.jsx(ma,{scope:t,forceMount:r,children:c.Children.map(n,i=>v.jsx(he,{present:r||o.open,children:v.jsx(St,{asChild:!0,container:a,children:i})}))})};Vt.displayName=Ie;var ue="DialogOverlay",qt=c.forwardRef((e,t)=>{const r=Ft(ue,e.__scopeDialog),{forceMount:n=r.forceMount,...a}=e,o=j(ue,e.__scopeDialog);return o.modal?v.jsx(he,{present:n||o.open,children:v.jsx(va,{...a,ref:t})}):null});qt.displayName=ue;var va=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,a=j(ue,r);return v.jsx(Ot,{as:pe,allowPinchZoom:!0,shards:[a.contentRef],children:v.jsx(_.div,{"data-state":Ve(a.open),...n,ref:t,style:{pointerEvents:"auto",...n.style}})})}),B="DialogContent",Ht=c.forwardRef((e,t)=>{const r=Ft(B,e.__scopeDialog),{forceMount:n=r.forceMount,...a}=e,o=j(B,e.__scopeDialog);return v.jsx(he,{present:n||o.open,children:o.modal?v.jsx(ga,{...a,ref:t}):v.jsx(ba,{...a,ref:t})})});Ht.displayName=B;var ga=c.forwardRef((e,t)=>{const r=j(B,e.__scopeDialog),n=c.useRef(null),a=U(t,r.contentRef,n);return c.useEffect(()=>{const o=n.current;if(o)return ha(o)},[]),v.jsx(Wt,{...e,ref:a,trapFocus:r.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:q(e.onCloseAutoFocus,o=>{var i;o.preventDefault(),(i=r.triggerRef.current)==null||i.focus()}),onPointerDownOutside:q(e.onPointerDownOutside,o=>{const i=o.detail.originalEvent,s=i.button===0&&i.ctrlKey===!0;(i.button===2||s)&&o.preventDefault()}),onFocusOutside:q(e.onFocusOutside,o=>o.preventDefault())})}),ba=c.forwardRef((e,t)=>{const r=j(B,e.__scopeDialog),n=c.useRef(!1),a=c.useRef(!1);return v.jsx(Wt,{...e,ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:o=>{var i,s;(i=e.onCloseAutoFocus)==null||i.call(e,o),o.defaultPrevented||(n.current||(s=r.triggerRef.current)==null||s.focus(),o.preventDefault()),n.current=!1,a.current=!1},onInteractOutside:o=>{var f,d;(f=e.onInteractOutside)==null||f.call(e,o),o.defaultPrevented||(n.current=!0,o.detail.originalEvent.type==="pointerdown"&&(a.current=!0));const i=o.target;((d=r.triggerRef.current)==null?void 0:d.contains(i))&&o.preventDefault(),o.detail.originalEvent.type==="focusin"&&a.current&&o.preventDefault()}})}),Wt=c.forwardRef((e,t)=>{const{__scopeDialog:r,trapFocus:n,onOpenAutoFocus:a,onCloseAutoFocus:o,...i}=e,s=j(B,r),f=c.useRef(null),d=U(t,f);return Pn(),v.jsxs(v.Fragment,{children:[v.jsx(Ct,{asChild:!0,loop:!0,trapped:n,onMountAutoFocus:a,onUnmountAutoFocus:o,children:v.jsx(wt,{role:"dialog",id:s.contentId,"aria-describedby":s.descriptionId,"aria-labelledby":s.titleId,"data-state":Ve(s.open),...i,ref:d,onDismiss:()=>s.onOpenChange(!1)})}),v.jsxs(v.Fragment,{children:[v.jsx(ka,{titleId:s.titleId}),v.jsx(wa,{contentRef:f,descriptionId:s.descriptionId})]})]})}),Fe="DialogTitle",Bt=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,a=j(Fe,r);return v.jsx(_.h2,{id:a.titleId,...n,ref:t})});Bt.displayName=Fe;var Ut="DialogDescription",Gt=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,a=j(Ut,r);return v.jsx(_.p,{id:a.descriptionId,...n,ref:t})});Gt.displayName=Ut;var $t="DialogClose",Kt=c.forwardRef((e,t)=>{const{__scopeDialog:r,...n}=e,a=j($t,r);return v.jsx(_.button,{type:"button",...n,ref:t,onClick:q(e.onClick,()=>a.onOpenChange(!1))})});Kt.displayName=$t;function Ve(e){return e?"open":"closed"}var Xt="DialogTitleWarning",[ii,Zt]=fr(Xt,{contentName:B,titleName:Fe,docsSlug:"dialog"}),ka=({titleId:e})=>{const t=Zt(Xt),r=`\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;return c.useEffect(()=>{e&&(document.getElementById(e)||console.error(r))},[r,e]),null},xa="DialogDescriptionWarning",wa=({contentRef:e,descriptionId:t})=>{const n=`Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Zt(xa).contentName}}.`;return c.useEffect(()=>{var o;const a=(o=e.current)==null?void 0:o.getAttribute("aria-describedby");t&&a&&(document.getElementById(t)||console.warn(n))},[n,e,t]),null},Yt=Tt,Ma=It,Qt=Vt,me=qt,ve=Ht,ge=Bt,be=Gt,Jt=Kt;const ci=Yt,li=Ma,Ca=Qt,er=c.forwardRef(({className:e,...t},r)=>v.jsx(me,{ref:r,className:z("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",e),...t}));er.displayName=me.displayName;const Ea=c.forwardRef(({className:e,children:t,...r},n)=>v.jsxs(Ca,{children:[v.jsx(er,{}),v.jsxs(ve,{ref:n,className:z("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg","max-h-[90vh] max-w-[95vw] w-[95vw] sm:w-full sm:max-w-lg","overflow-hidden flex flex-col",e),...r,children:[v.jsx("div",{className:"overflow-y-auto max-h-full flex-1 flex flex-col",children:t}),v.jsxs(Jt,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10",children:[v.jsx(kt,{className:"h-4 w-4"}),v.jsx("span",{className:"sr-only",children:"Close"})]})]})]}));Ea.displayName=ve.displayName;const Sa=({className:e,...t})=>v.jsx("div",{className:z("flex flex-col space-y-1.5 text-center sm:text-left",e),...t});Sa.displayName="DialogHeader";const Aa=({className:e,...t})=>v.jsx("div",{className:z("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",e),...t});Aa.displayName="DialogFooter";const Na=c.forwardRef(({className:e,...t},r)=>v.jsx(ge,{ref:r,className:z("text-lg font-semibold leading-none tracking-tight",e),...t}));Na.displayName=ge.displayName;const Pa=c.forwardRef(({className:e,...t},r)=>v.jsx(be,{ref:r,className:z("text-sm text-muted-foreground",e),...t}));Pa.displayName=be.displayName;const di=Yt,Ra=Qt,tr=c.forwardRef(({className:e,...t},r)=>v.jsx(me,{className:z("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",e),...t,ref:r}));tr.displayName=me.displayName;const za=gt("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",{variants:{side:{top:"inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",bottom:"inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",left:"inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",right:"inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"}},defaultVariants:{side:"right"}}),ja=c.forwardRef(({side:e="right",className:t,children:r,...n},a)=>v.jsxs(Ra,{children:[v.jsx(tr,{}),v.jsxs(ve,{ref:a,className:z(za({side:e}),t),...n,children:[r,v.jsxs(Jt,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",children:[v.jsx(kt,{className:"h-4 w-4"}),v.jsx("span",{className:"sr-only",children:"Close"})]})]})]}));ja.displayName=ve.displayName;const Oa=c.forwardRef(({className:e,...t},r)=>v.jsx(ge,{ref:r,className:z("text-lg font-semibold text-foreground",e),...t}));Oa.displayName=ge.displayName;const La=c.forwardRef(({className:e,...t},r)=>v.jsx(be,{ref:r,className:z("text-sm text-muted-foreground",e),...t}));La.displayName=be.displayName;export{Ds as $,Xa as A,ln as B,vo as C,wt as D,ft as E,Ct as F,ms as G,Es as H,Jo as I,Ba as J,Ia as K,is as L,vs as M,Ta as N,lt as O,_ as P,ur as Q,Ot as R,_s as S,$s as T,_a as U,bo as V,ai as W,kt as X,Ko as Y,oi as Z,O as _,po as a,js as a$,Yo as a0,To as a1,jo as a2,Ts as a3,ks as a4,Ws as a5,fo as a6,Ys as a7,ci as a8,Ea as a9,Jt as aA,Qt as aB,Yt as aC,cn as aD,Ho as aE,ss as aF,qa as aG,$a as aH,Wa as aI,no as aJ,Ps as aK,xo as aL,Ha as aM,Va as aN,Ga as aO,Ka as aP,ri as aQ,Co as aR,Do as aS,li as aT,co as aU,Bo as aV,Ja as aW,fs as aX,Fo as aY,Fa as aZ,Xo as a_,Sa as aa,Na as ab,Pa as ac,ws as ad,Aa as ae,Qa as af,Os as ag,gs as ah,ls as ai,Js as aj,qo as ak,Ro as al,uo as am,wo as an,Oo as ao,cs as ap,Ns as aq,Bs as ar,si as as,Ma as at,me as au,ii as av,ve as aw,mr as ax,ge as ay,be as az,pe as b,Pt as b$,Ao as b0,mo as b1,No as b2,Eo as b3,Gs as b4,Us as b5,ro as b6,oo as b7,ao as b8,ns as b9,es as bA,ko as bB,as as bC,Qo as bD,Cs as bE,yo as bF,hs as bG,_o as bH,ts as bI,Ms as bJ,zo as bK,ho as bL,ti as bM,xs as bN,ps as bO,Wo as bP,ds as bQ,Vo as bR,Ks as bS,Ss as bT,Zo as bU,Ya as bV,us as bW,_n as bX,Ln as bY,le as bZ,ce as b_,ei as ba,Mo as bb,Po as bc,Xs as bd,Zs as be,Is as bf,os as bg,Ua as bh,qs as bi,ys as bj,zs as bk,Io as bl,Za as bm,Qs as bn,As as bo,Vs as bp,Hs as bq,So as br,to as bs,Lo as bt,bs as bu,rs as bv,Uo as bw,Go as bx,$o as by,eo as bz,Cr as c,Yn as c0,In as c1,di as c2,ja as c3,W as d,q as e,we as f,z as g,gt as h,pr as i,v as j,de as k,he as l,ha as m,Pn as n,dt as o,Mr as p,St as q,lo as r,so as s,go as t,U as u,ni as v,io as w,Ls as x,Fs as y,Rs as z};
