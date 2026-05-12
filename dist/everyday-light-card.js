function e(e,t,i,o){var s,r=arguments.length,a=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(s=e[n])&&(a=(r<3?s(a):r>3?s(t,i,a):s(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new r(i,e,o)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,g=m.trustedTypes,f=g?g.emptyScript:"",v=m.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},_=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:_};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&d(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:s}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const r=o?.call(this);s?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=o;const r=s.fromAttribute(t,e.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(e,t,i,o=!1,s){if(void 0!==e){const r=this.constructor;if(!1===o&&(s=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??_)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:s},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==s||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[y("elementProperties")]=new Map,w[y("finalized")]=new Map,v?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,$=e=>e,P=k.trustedTypes,S=P?P.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+C,A=`<${E}>`,R=document,O=()=>R.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,I=Array.isArray,z="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,N=/>/g,H=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,B=/"/g,W=/^(?:script|style|textarea|title)$/i,U=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),G=U(1),q=U(2),V=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),F=new WeakMap,K=R.createTreeWalker(R,129);function X(e,t){if(!I(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const Q=(e,t)=>{const i=e.length-1,o=[];let s,r=2===t?"<svg>":3===t?"<math>":"",a=D;for(let t=0;t<i;t++){const i=e[t];let n,l,d=-1,c=0;for(;c<i.length&&(a.lastIndex=c,l=a.exec(i),null!==l);)c=a.lastIndex,a===D?"!--"===l[1]?a=L:void 0!==l[1]?a=N:void 0!==l[2]?(W.test(l[2])&&(s=RegExp("</"+l[2],"g")),a=H):void 0!==l[3]&&(a=H):a===H?">"===l[0]?(a=s??D,d=-1):void 0===l[1]?d=-2:(d=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?H:'"'===l[3]?B:j):a===B||a===j?a=H:a===L||a===N?a=D:(a=H,s=void 0);const h=a===H&&e[t+1].startsWith("/>")?" ":"";r+=a===D?i+A:d>=0?(o.push(n),i.slice(0,d)+M+i.slice(d)+C+h):i+C+(-2===d?t:h)}return[X(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class J{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let s=0,r=0;const a=e.length-1,n=this.parts,[l,d]=Q(e,t);if(this.el=J.createElement(l,i),K.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=K.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(M)){const t=d[r++],i=o.getAttribute(e).split(C),a=/([.?@])?(.*)/.exec(t);n.push({type:1,index:s,name:a[2],strings:i,ctor:"."===a[1]?oe:"?"===a[1]?se:"@"===a[1]?re:ie}),o.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:s}),o.removeAttribute(e));if(W.test(o.tagName)){const e=o.textContent.split(C),t=e.length-1;if(t>0){o.textContent=P?P.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],O()),K.nextNode(),n.push({type:2,index:++s});o.append(e[t],O())}}}else if(8===o.nodeType)if(o.data===E)n.push({type:2,index:s});else{let e=-1;for(;-1!==(e=o.data.indexOf(C,e+1));)n.push({type:7,index:s}),e+=C.length-1}s++}}static createElement(e,t){const i=R.createElement("template");return i.innerHTML=e,i}}function Z(e,t,i=e,o){if(t===V)return t;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const r=T(t)?void 0:t._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(e),s._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(t=Z(e,s._$AS(e,t.values),s,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??R).importNode(t,!0);K.currentNode=o;let s=K.nextNode(),r=0,a=0,n=i[0];for(;void 0!==n;){if(r===n.index){let t;2===n.type?t=new te(s,s.nextSibling,this,e):1===n.type?t=new n.ctor(s,n.name,n.strings,this,e):6===n.type&&(t=new ae(s,this,e)),this._$AV.push(t),n=i[++a]}r!==n?.index&&(s=K.nextNode(),r++)}return K.currentNode=R,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),T(e)?e===Y||null==e||""===e?(this._$AH!==Y&&this._$AR(),this._$AH=Y):e!==this._$AH&&e!==V&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>I(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Y&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=J.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=F.get(e.strings);return void 0===t&&F.set(e.strings,t=new J(e)),t}k(e){I(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const s of e)o===t.length?t.push(i=new te(this.O(O()),this.O(O()),this,this.options)):i=t[o],i._$AI(s),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ie{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,s){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(e,t=this,i,o){const s=this.strings;let r=!1;if(void 0===s)e=Z(this,e,t,0),r=!T(e)||e!==this._$AH&&e!==V,r&&(this._$AH=e);else{const o=e;let a,n;for(e=s[0],a=0;a<s.length-1;a++)n=Z(this,o[i+a],t,a),n===V&&(n=this._$AH[a]),r||=!T(n)||n!==this._$AH[a],n===Y?e=Y:e!==Y&&(e+=(n??"")+s[a+1]),this._$AH[a]=n}r&&!o&&this.j(e)}j(e){e===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class oe extends ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Y?void 0:e}}class se extends ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Y)}}class re extends ie{constructor(e,t,i,o,s){super(e,t,i,o,s),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??Y)===V)return;const i=this._$AH,o=e===Y&&i!==Y||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==Y&&(i===Y||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const ne=k.litHtmlPolyfillSupport;ne?.(J,te),(k.litHtmlVersions??=[]).push("3.3.2");const le=(e,t,i)=>{const o=i?.renderBefore??t;let s=o._$litPart$;if(void 0===s){const e=i?.renderBefore??null;o._$litPart$=s=new te(t.insertBefore(O(),e),e,void 0,i??{})}return s._$AI(e),s},de=globalThis;class ce extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=le(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}ce._$litElement$=!0,ce.finalized=!0,de.litElementHydrateSupport?.({LitElement:ce});const he=de.litElementPolyfillSupport;he?.({LitElement:ce}),(de.litElementVersions??=[]).push("4.2.2");const pe=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},ue={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:_},me=(e=ue,t,i)=>{const{kind:o,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const s=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,s,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];t.call(this,i),this.requestUpdate(o,s,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ge(e){return(t,i)=>"object"==typeof i?me(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function fe(e){return ge({...e,state:!0,attribute:!1})}let ve;function ye(e,t,i){const o=Math.floor(6*e),s=6*e-o,r=i*(1-t),a=i*(1-s*t),n=i*(1-(1-s)*t);let l=0,d=0,c=0;switch(o%6){case 0:l=i,d=n,c=r;break;case 1:l=a,d=i,c=r;break;case 2:l=r,d=i,c=n;break;case 3:l=r,d=a,c=i;break;case 4:l=n,d=r,c=i;break;case 5:l=i,d=r,c=a}return[Math.round(255*l),Math.round(255*d),Math.round(255*c)]}let be=class extends ce{constructor(){super(...arguments),this.entity="",this.mode="brightness",this.minKelvin=2e3,this.maxKelvin=6500,this.orientation="vertical",this.styleVariant="pill",this.showMindmapHint=!1,this._dragValue=null,this._pinnedAtTop=!1,this._isDragging=!1,this._serviceDebounceTimer=null,this._pendingValue=null,this._committedValue=null,this._commitTimeoutId=null,this._lastSnapshots={},this._onPointerDown=e=>{if(this.entity&&this.hass&&(void 0===e.button||0===e.button)){e.preventDefault();try{this.setPointerCapture(e.pointerId)}catch{}this._isDragging=!0,this._updateFromPointer(e)}},this._onPointerMove=e=>{this._isDragging&&this._updateFromPointer(e)},this._onPointerUp=e=>{if(this._isDragging){try{this.releasePointerCapture(e.pointerId)}catch{}this._isDragging=!1,this._updateFromPointer(e),this._commitNow()}}}connectedCallback(){super.connectedCallback(),this.addEventListener("pointerdown",this._onPointerDown),this.addEventListener("pointermove",this._onPointerMove),this.addEventListener("pointerup",this._onPointerUp),this.addEventListener("pointercancel",this._onPointerUp)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("pointerdown",this._onPointerDown),this.removeEventListener("pointermove",this._onPointerMove),this.removeEventListener("pointerup",this._onPointerUp),this.removeEventListener("pointercancel",this._onPointerUp),null!==this._serviceDebounceTimer&&(clearTimeout(this._serviceDebounceTimer),this._serviceDebounceTimer=null),null!==this._commitTimeoutId&&(clearTimeout(this._commitTimeoutId),this._commitTimeoutId=null)}updated(e){if(super.updated(e),e.has("mode")&&(this._dragValue=null,this._committedValue=null,null!==this._commitTimeoutId&&(clearTimeout(this._commitTimeoutId),this._commitTimeoutId=null)),e.has("hass")){const e=this.stateObj;if(e&&"on"===e.state){const t=e.attributes.brightness;"number"==typeof t&&(this._lastSnapshots.brightness=Math.max(0,Math.min(1,t/255)));const i=e.attributes.hs_color;if(i&&2===i.length){const e=(i[0]%360+360)%360;this._lastSnapshots.hue=Math.max(0,Math.min(1,e/360)),this._lastSnapshots.saturation=Math.max(0,Math.min(1,i[1]/100))}const o=e.attributes.color_temp_kelvin;if("number"==typeof o&&o>0){const e=this.maxKelvin-this.minKelvin;e>0&&(this._lastSnapshots.temperature=1-Math.max(0,Math.min(1,(o-this.minKelvin)/e)))}}}if(null!==this._committedValue&&!this._isDragging&&e.has("hass")){const e=this._hassFraction();(this._committedValue<=.005&&"on"!==this.stateObj?.state||Math.abs(e-this._committedValue)<=.02)&&(this._dragValue=null,this._committedValue=null,null!==this._commitTimeoutId&&(clearTimeout(this._commitTimeoutId),this._commitTimeoutId=null))}}get stateObj(){return this.entity&&this.hass?this.hass.states[this.entity]:void 0}_hassFraction(){const e=this.stateObj;if(!e)return 0;if("volume"===this.mode){const t=e.attributes.volume_level??0;return Math.max(0,Math.min(1,t))}if("on"!==e.state)return"brightness"===this.mode?0:this._lastSnapshots[this.mode]??0;if("brightness"===this.mode){const t=e.attributes.brightness??0;return Math.max(0,Math.min(1,t/255))}if("hue"===this.mode){const t=e.attributes.hs_color,i=((t?.[0]??0)%360+360)%360;return Math.max(0,Math.min(1,i/360))}if("saturation"===this.mode){const t=e.attributes.hs_color,i=t?.[1]??0;return Math.max(0,Math.min(1,i/100))}const t=e.attributes.color_temp_kelvin??this.minKelvin,i=this.maxKelvin-this.minKelvin;return i<=0?0:1-Math.max(0,Math.min(1,(t-this.minKelvin)/i))}_currentFraction(){return null!==this._dragValue?this._dragValue:"hue"===this.mode&&this._pinnedAtTop?1:this._hassFraction()}_fillColor(){const e=this.stateObj;if("volume"===this.mode)return"var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a))";if(!e)return"rgba(0,0,0,0)";if("on"===e.state){const t=e.attributes.rgb_color;return t&&3===t.length?`rgb(${t[0]}, ${t[1]}, ${t[2]})`:"var(--primary-color)"}if("brightness"===this.mode)return"rgba(0,0,0,0)";const t=this._lastSnapshots.hue,i=this._lastSnapshots.saturation,o=this._lastSnapshots.brightness;if(void 0!==t&&void 0!==i){const e=ye(t,i,o??1);return`rgb(${e[0]}, ${e[1]}, ${e[2]})`}const s=e.attributes.hs_color;if(s&&2===s.length){const e=ye((s[0]%360+360)%360/360,Math.max(0,Math.min(1,s[1]/100)),1);return`rgb(${e[0]}, ${e[1]}, ${e[2]})`}const r=e.attributes.rgb_color;return r&&3===r.length?`rgb(${r[0]}, ${r[1]}, ${r[2]})`:"var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a))"}_label(){const e=this.stateObj;if(!e)return"";if("volume"===this.mode)return`${Math.round(100*this._currentFraction())}`;if("on"!==e.state)return"";if("brightness"===this.mode)return`${Math.round(100*this._currentFraction())}`;if("hue"===this.mode)return`${Math.round(360*this._currentFraction())}°`;if("saturation"===this.mode)return`${Math.round(100*this._currentFraction())}`;const t=e.attributes.color_temp_kelvin??0;return t?`${Math.round(1e6/t)}`:""}_updateFromPointer(e){const t=this.renderRoot.querySelector(".track");if(!t)return;const i=t.getBoundingClientRect();if("horizontal"===this.orientation){if(i.width<=0)return;const t=i.height/2,o=e.clientX-i.left,s=t,r=i.width-t,a=Math.max(1,r-s),n=(Math.max(s,Math.min(r,o))-s)/a;return this._dragValue=n,void this._scheduleServiceCall(n)}if(i.height<=0)return;const o=i.width/2,s=i.height-(e.clientY-i.top),r=o,a=i.height-o,n=Math.max(1,a-r),l=(Math.max(r,Math.min(a,s))-r)/n;this._dragValue=l,"hue"===this.mode&&l<.999&&(this._pinnedAtTop=!1),this._scheduleServiceCall(l)}_scheduleServiceCall(e){this._pendingValue=e,null===this._serviceDebounceTimer&&(this._serviceDebounceTimer=window.setTimeout(()=>{this._serviceDebounceTimer=null;const e=this._pendingValue;this._pendingValue=null,null!==e&&this._callService(e)},50))}_commitNow(){null!==this._serviceDebounceTimer&&(clearTimeout(this._serviceDebounceTimer),this._serviceDebounceTimer=null);const e=this._pendingValue??this._dragValue;this._pendingValue=null,null!==e&&(this._callService(e),this._committedValue=e,null!==this._commitTimeoutId&&clearTimeout(this._commitTimeoutId),this._commitTimeoutId=window.setTimeout(()=>{this._commitTimeoutId=null,this._dragValue=null,this._committedValue=null},1500))}_callService(e){if(!this.hass||!this.entity)return;if("volume"===this.mode){if(e<=.005)return void this.hass.callService("media_player","volume_mute",{entity_id:this.entity,is_volume_muted:!0});const t=this.stateObj?.attributes?.is_volume_muted;return t&&this.hass.callService("media_player","volume_mute",{entity_id:this.entity,is_volume_muted:!1}),void this.hass.callService("media_player","volume_set",{entity_id:this.entity,volume_level:Math.max(0,Math.min(1,e))})}if("brightness"===this.mode){if(e<=.005)return void this.hass.callService("light","turn_off",{entity_id:this.entity});const t=Math.round(255*e);return void this.hass.callService("light","turn_on",{entity_id:this.entity,brightness:t})}const t="on"!==this.stateObj?.state;if("hue"===this.mode){const i=this.stateObj?.attributes?.hs_color,o=this._lastSnapshots.saturation,s=t?void 0!==o?Math.round(100*o):100:Math.round(i?.[1]??100),r=Math.round(360*e);this._pinnedAtTop=e>=.999;const a={entity_id:this.entity,hs_color:[r,s]};return t&&void 0!==this._lastSnapshots.brightness&&(a.brightness=Math.round(255*this._lastSnapshots.brightness)),void this.hass.callService("light","turn_on",a)}if("saturation"===this.mode){const i=this.stateObj?.attributes?.hs_color,o=this._lastSnapshots.hue,s=t?void 0!==o?Math.round(360*o):0:i?.[0]??0,r=Math.max(1,Math.round(100*e)),a={entity_id:this.entity,hs_color:[s,r]};return t&&void 0!==this._lastSnapshots.brightness&&(a.brightness=Math.round(255*this._lastSnapshots.brightness)),void this.hass.callService("light","turn_on",a)}const i=Math.round(this.maxKelvin-e*(this.maxKelvin-this.minKelvin)),o={entity_id:this.entity,color_temp_kelvin:i};t&&void 0!==this._lastSnapshots.brightness&&(o.brightness=Math.round(255*this._lastSnapshots.brightness)),this.hass.callService("light","turn_on",o)}render(){const e=this.stateObj;if(!this.hass)return G`<div class="container"><div class="track loading"></div></div>`;if(!e)return G`<div class="container">
        <div class="track error" title="Entity not found">${this.entity}</div>
      </div>`;const t=this._currentFraction(),i=this._fillColor(),o=this._label(),s="brightness"===this.mode,r="volume"===this.mode,a=s||r,n="on"===e.state?"on":"off",l=this._isDragging?"dragging":"",d=e.attributes.color_mode,c=!!d&&"color_temp"!==d&&"brightness"!==d&&"onoff"!==d&&"unknown"!==d,h="color_temp"===d,p="temperature"===this.mode&&"on"===e.state&&c,u=("hue"===this.mode||"saturation"===this.mode)&&"on"===e.state&&h,m=("hue"===this.mode||"saturation"===this.mode||"temperature"===this.mode)&&"on"!==e.state,g=p||u||m,f=e.attributes.hs_color,v="on"===e.state&&f?f[0]:void 0!==this._lastSnapshots.hue?360*this._lastSnapshots.hue:0;return G`
      <div class="container ${l}" style=${`--fill-frac: ${t}; --hue-color: ${`hsl(${v}, 100%, 50%)`};`}>
        <div class="track ${this.mode} ${n}">
          ${a?G`<div class="fill" style=${`background: ${i};`}></div>`:null}
        </div>
        ${g?null:G`
              <div
                class=${a?"thumb":"color-thumb"}
                style=${a?"":`background: ${i};`}
              >
                <span class="label">${o}</span>
              </div>
            `}
      </div>
    `}};be.styles=a`
    :host {
      display: block;
      /* ------------------------------------------------------------------
         CSS-Variable architecture — Stefan-2026-05-09 P41 (corrects P40)
         ------------------------------------------------------------------
         --everyday-slider-width   OUTER host width. Default 60. Group view
                                   inherits 47 from group-layout-expanded.
         --pill-width              INNER pill width (gradient track + the
                                   brightness/volume .thumb). Default ALIASED
                                   to slider-width so the pill spans the host
                                   horizontally — the white ring on the
                                   colour-thumb lives BETWEEN pill and
                                   thumb-content rather than between host and
                                   pill. Stefan-2026-05-09 R5+R6+R7-corr
                                   ("--thumb-size soll ein fixer wert sein,
                                   .color-thumb width=height=thumb-size").
         --thumb-size              Brightness/volume thumb diameter AND the
                                   colour-thumb's inner content disc.
                                   Stefan-2026-05-09 P42 R15: back to a calc
                                   so the thumb scales with host-width.
                                     calc(var(--everyday-slider-width) * 0.8)
                                   Default 60 → 48. Group 47 → 37.6.
         --color-thumb-border      Stefan-formula:
                                     (--everyday-slider-width - --thumb-size) / 2
                                   With thumb-size = slider-width × 0.8, this
                                   simplifies to slider-width × 0.1 — a 10 %
                                   ring on each side. Default 6 px, group 4.7.
                                   With box-sizing:content-box and
                                   width/height = thumb-size, the OUTER box
                                   (incl. border) spans the full host width —
                                   the colour-thumb visually fills the lane.
         --range                   Vertical travel of the thumb center.
                                   = pill-height - pill-width.
         ------------------------------------------------------------------ */
      /* Stefan-2026-05-10 P15.6-r47 (R228): use var-with-fallback for
         all derived calcs INSTEAD of declaring --everyday-slider-width
         on :host. A :host declaration has higher specificity than an
         inherited value, so a parent inline-style override (e.g.
         group-layout-expanded.ts setting --everyday-slider-width: 27px
         on .layout) was never reaching the slider. Stefan-Quote: "i
         tried this config but the slider width doesnt change". With the
         fallback pattern, var(--everyday-slider-width, 60px) picks up
         the parent value when set, falls back to 60 when unset. */
      --pill-width: var(--everyday-slider-width, 60px);
      /* Stefan-2026-05-12 PA-0002: default bumped 220 -> 270. Stefan-Quote:
         "the default slider length should be 270px". Affects single-light
         + compact-host + parallel-inline + popup paths via the cascading
         override chain. Explicit slider.height config still wins. */
      --pill-height: var(--everyday-slider-height, 270px);
      --pill-half: calc(var(--pill-width) / 2);
      --thumb-size: calc(var(--everyday-slider-width, 60px) * 0.8);
      --color-thumb-border: calc((var(--everyday-slider-width, 60px) - var(--thumb-size)) / 2);
      /* range = how far the thumb's *center* travels from min to max */
      --range: calc(var(--pill-height) - var(--pill-width));
      width: var(--everyday-slider-width, 60px);
      height: var(--pill-height);
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    .track {
      /* Track is the visible PILL — fills the host since --pill-width is
         aliased to --everyday-slider-width by default. P41 reverts the
         centring transform from P40; the inner-vs-outer pill distinction
         is no longer the load-bearing concept (Stefan-2026-05-09 R5+R6+R7
         corr). */
      position: absolute;
      inset: 0;
      border-radius: var(--pill-half);
      background: rgba(0, 0, 0, 0.2);
      overflow: hidden;
      /* Stefan-2026-05-10 R165: dropped the OUTER slider drop-shadows.
         They were tuned for the dark paris theme and looked wrong in
         the default HA theme (heavy black bloom cast on light card
         surface). The inset shadow alone carries the depth. Themes that
         want the outer-shadow look can override --everyday-slider-outer-shadow
         (default none) - not the x/y vars from before, since those
         left a centered halo at offset 0. */
      box-shadow:
        inset 0 2px 3px rgba(0, 0, 0, 0.30),
        var(--everyday-slider-outer-shadow, none);
    }
    .track.loading {
      opacity: 0.4;
    }
    .track.error {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--error-color, #c62828);
      font-size: 11px;
      padding: 8px;
      background: rgba(198, 40, 40, 0.1);
    }
    .track.temperature {
      background: linear-gradient(to top, rgb(244, 253, 255) 0%, rgb(255, 136, 13) 100%);
    }
    .track.hue {
      /* Stefan-2026-05-10 R183b: gradient stops INSET by pill-half so the
         hue colors line up with the thumb-valid Y range (where fraction
         is computed). Pre-r25 the gradient spanned the full track height
         while fraction was clamped to [pill-half, height - pill-half] —
         clicking on visually-green produced fraction values that mapped
         to yellow. Now: bottom pill-half = solid red 0°, top pill-half =
         solid red 360°, and the rainbow transitions across the central
         range matching the thumb's reach. Calc-based stops let the
         gradient adapt when --pill-height changes (170/220/260). */
      background: linear-gradient(
        to top,
        hsl(0, 100%, 50%) 0,
        hsl(0, 100%, 50%) var(--pill-half),
        hsl(60, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.166),
        hsl(120, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.333),
        hsl(180, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.5),
        hsl(240, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.667),
        hsl(300, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.833),
        hsl(360, 100%, 50%) calc(var(--pill-half) + var(--range)),
        hsl(360, 100%, 50%) 100%
      );
    }
    .track.saturation {
      /* Bottom = grey (0% sat), top = current hue at 100% saturation. */
      background: linear-gradient(
        to top,
        rgb(150, 150, 150) 0%,
        var(--hue-color, hsl(0, 100%, 50%)) 100%
      );
    }
    .fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      /* fill_height = pill-width (= the bottom dome at f=0) + fraction * range */
      height: calc(var(--pill-width) + var(--fill-frac, 0) * var(--range));
      /* Top corners rounded with pill-half radius - that's the colored "cap"
         Stefan was missing above the thumb. Bottom is auto-clipped by the
         track's overflow: hidden + matching pill curve. */
      border-radius: var(--pill-half) var(--pill-half) 0 0;
      transition: height 80ms linear, background 200ms ease-out;
      will-change: height, background;
    }
    .track.off .fill {
      background: rgba(0, 0, 0, 0) !important;
    }
    .thumb,
    .color-thumb {
      position: absolute;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: bottom 80ms linear;
      will-change: bottom;
      pointer-events: none;
    }
    /* Brightness/volume thumb: round, --thumb-size diameter, centred in the
       host. Stefan-2026-05-09 R7: brightness is the reference look — keep it. */
    .thumb {
      left: calc(50% - var(--thumb-size) / 2);
      width: var(--thumb-size);
      height: var(--thumb-size);
      border-radius: 50%;
      background: white;
      bottom: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
    }
    /* Color-control thumb (temp / hue / saturation): Stefan-2026-05-09 P42
       (corrects P41 - Stefan said left=undefined, thumb-size back to calc).
         - Square geometry: width = height = --thumb-size (= slider-width × 0.8).
         - NO left - the thumb is auto-centred in the host by box-sizing
           content-box + matching border. With thumb-size + 2×border =
           slider-width = host width, the outer box fills the host
           horizontally and the inner content sits centred.
         - border = (slider-width - thumb-size) / 2 - Stefan formula.
           Simplifies to slider-width × 0.1 (10 % ring) given thumb-size is
           80 % of slider-width.
       Bottom math (Stefan-2026-05-09 P47-fix R48): thumb-OUTER-bottom is
       flush with pill-bottom at fill-frac=0 (no gap). With outer-size =
       thumb-size + 2x border = pill-width, the outer box from bottom 0
       to bottom 0 + outer-size = pill-width fills the pill bottom-cap
       exactly. At fill-frac=1, bottom = range = pill-height - pill-width,
       so outer-top = bottom + outer-size = pill-height (top-cap edge). */
    .color-thumb {
      /* Stefan-2026-05-10 P15.6-r34 (R199): switched from content-box +
         calc-derived width/height to border-box + left:0 right:0 +
         height: pill-width. Reason: with content-box and fractional CSS
         vars (e.g. --everyday-slider-width: 47 → thumb-size: 37.6 +
         border: 4.7), browsers round each component independently and
         the OUTER box ends up 1-2 px narrower/shorter than the pill
         track on top + right. New layout pins the outer box to the
         pill's exact dimensions; border thickness is consumed from
         within so the inner-circle radius adapts automatically. */
      left: 0;
      right: 0;
      height: var(--pill-width);
      box-sizing: border-box;
      border: var(--color-thumb-border) solid white;
      border-radius: 50%;
      background: white;
      bottom: calc(var(--fill-frac, 0) * var(--range));
    }
    /* Active drag → kill transitions so the cursor and the thumb stay in lockstep. */
    .container.dragging .fill,
    .container.dragging .thumb,
    .container.dragging .color-thumb {
      transition: none;
    }
    .label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      font-family: var(--paper-font-body1_-_font-family);
    }

    /* ----- Horizontal orientation: PILL style (default) ----- */
    /* Stefan-2026-05-09: horizontal default is the original pill (full-width
       gradient track + thumb travelling along X). Mixer-fader is OPT-IN via
       style-variant='mixer' (handled below). */
    :host([orientation='horizontal']) {
      width: var(--pill-height);
      /* OUTER cross-axis dimension matches --everyday-slider-width (incl. white ring).
         Stefan-2026-05-10 P15.6-r47 (R228): also fallback-pattern for
         orientation=horizontal so per-card slider.width still wins. */
      height: var(--everyday-slider-width, 60px);
    }
    :host([orientation='horizontal']) {
      /* Horizontal: swap axes. Host width = pill-height (long axis), height
         = pill-width (short axis). Track stays inset:0 like the vertical
         orientation since pill-width = slider-width. */
    }
    :host([orientation='horizontal']) .track.temperature {
      background: linear-gradient(to right, rgb(244, 253, 255) 0%, rgb(255, 136, 13) 100%);
    }
    :host([orientation='horizontal']) .track.hue {
      background: linear-gradient(
        to right,
        hsl(0, 100%, 50%) 0%,
        hsl(60, 100%, 50%) 17%,
        hsl(120, 100%, 50%) 33%,
        hsl(180, 100%, 50%) 50%,
        hsl(240, 100%, 50%) 67%,
        hsl(300, 100%, 50%) 83%,
        hsl(360, 100%, 50%) 100%
      );
    }
    :host([orientation='horizontal']) .track.saturation {
      background: linear-gradient(to right, rgb(150, 150, 150) 0%, var(--hue-color, hsl(0, 100%, 50%)) 100%);
    }
    /* Fill grows from left to right (pill style). */
    :host([orientation='horizontal']) .fill {
      right: auto;
      bottom: auto;
      top: 0;
      height: 100%;
      width: calc(var(--pill-width) + var(--fill-frac, 0) * var(--range));
      border-radius: 0 var(--pill-half) var(--pill-half) 0;
      transition: width 80ms linear, background 200ms ease-out;
      will-change: width, background;
    }
    /* Thumb travels along the X axis (pill style). */
    :host([orientation='horizontal']) .thumb,
    :host([orientation='horizontal']) .color-thumb {
      bottom: auto;
      transition: left 80ms linear;
      will-change: left;
    }
    :host([orientation='horizontal']) .thumb {
      /* Brightness/volume thumb: round, centred on cross-axis, travels X. */
      top: calc(50% - var(--thumb-size) / 2);
      left: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
      width: var(--thumb-size);
      height: var(--thumb-size);
    }
    :host([orientation='horizontal']) .color-thumb {
      /* Horizontal: square thumb-size × thumb-size with white ring. Travels
         along X like the brightness thumb; cross-axis (top) auto-centres
         via the equal border on top + bottom (content-box mode). Stefan-
         2026-05-09 P42. */
      top: 0;
      left: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
      width: var(--thumb-size);
      height: var(--thumb-size);
    }

    /* ----- Horizontal orientation: MIXER style (opt-in) ----- */
    /* Stefan-2026-05-09: thin centred track + portrait rectangular pill
       thumb extending past the track. DJ-board / mixer-fader look. Opt-in
       via slider.style: 'mixer' which sets style-variant='mixer' on the
       host. */
    :host([orientation='horizontal'][style-variant='mixer']) {
      --hbar-height: 44px;
      --hbar-track-h: 14px;
      --hbar-thumb-w: 20px;
      --hbar-thumb-h: 44px;
      --hbar-thumb-r: 12px;
      --hbar-range: calc(var(--pill-height) - var(--hbar-thumb-w));
      width: var(--pill-height);
      height: var(--hbar-height);
    }
    :host([orientation='horizontal'][style-variant='mixer']) .track {
      /* Mixer-fader override: reset the transform from the parent horizontal
         rule (which uses translateY(-50%)) so the mixer's explicit top
         math isn't double-offset. Frontend-developer review 2026-05-09 P40. */
      inset: auto 0;
      transform: none;
      top: calc(50% - var(--hbar-track-h) / 2);
      height: var(--hbar-track-h);
      width: 100%;
      border-radius: calc(var(--hbar-track-h) / 2);
    }
    :host([orientation='horizontal'][style-variant='mixer']) .fill {
      width: calc(var(--hbar-track-h) + var(--fill-frac, 0) * var(--hbar-range));
      border-radius: 0 calc(var(--hbar-track-h) / 2) calc(var(--hbar-track-h) / 2) 0;
    }
    :host([orientation='horizontal'][style-variant='mixer']) .thumb,
    :host([orientation='horizontal'][style-variant='mixer']) .color-thumb {
      width: var(--hbar-thumb-w);
      height: var(--hbar-thumb-h);
      border-radius: var(--hbar-thumb-r);
      top: calc(50% - var(--hbar-thumb-h) / 2);
      left: calc(var(--fill-frac, 0) * var(--hbar-range));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
      background: var(--everyday-mixer-handle, white);
      border: none;
    }
  `,e([ge({attribute:!1})],be.prototype,"hass",void 0),e([ge({type:String})],be.prototype,"entity",void 0),e([ge({type:String})],be.prototype,"mode",void 0),e([ge({type:Number,attribute:"min-kelvin"})],be.prototype,"minKelvin",void 0),e([ge({type:Number,attribute:"max-kelvin"})],be.prototype,"maxKelvin",void 0),e([ge({type:String,reflect:!0})],be.prototype,"orientation",void 0),e([ge({type:String,reflect:!0,attribute:"style-variant"})],be.prototype,"styleVariant",void 0),e([ge({type:Boolean,reflect:!0,attribute:"mindmap-hint"})],be.prototype,"showMindmapHint",void 0),e([fe()],be.prototype,"_dragValue",void 0),e([fe()],be.prototype,"_isDragging",void 0),be=e([pe("everyday-vertical-pill-slider")],be);const _e="var(--disabled-color, rgba(150, 150, 150, 0.55))";let xe=class extends ce{constructor(){super(...arguments),this.members=[],this.responsive=!0,this.viewWidth=300,this.viewHeight=200,this.margin=30,this.strokeWidth=2.6,this.fallbackAtN=100,this.tileGap=0,this.groupIconOffset=10,this.iconPosition="bottom",this.dotsEnabled=!0,this.stretch=!1,this._measuredWidth=300,this._measuredHeight=200}connectedCallback(){super.connectedCallback(),"undefined"!=typeof ResizeObserver&&(this._resizeObserver=new ResizeObserver(e=>{const t=e[0];if(!t)return;const{width:i,height:o}=t.contentRect;i>0&&o>0&&(i!==this._measuredWidth&&(this._measuredWidth=i),o!==this._measuredHeight&&(this._measuredHeight=o))}),this._resizeObserver.observe(this))}disconnectedCallback(){super.disconnectedCallback(),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}get _W(){return this.responsive?this._measuredWidth:this.viewWidth}get _H(){return this.responsive?this._measuredHeight:this.viewHeight}get _groupX(){return void 0!==this.groupXOverride?this.groupXOverride:this.responsive?this._W/2:150}get _groupY(){return void 0!==this.groupYOverride?this.groupYOverride:this.responsive?"top"===this.iconPosition?this.groupIconOffset:this._H-this.groupIconOffset:170}get _memberY(){if(void 0!==this.memberYOverride)return this.memberYOverride;if(!this.responsive)return 30;return"top"===this.iconPosition?140:this._H-140}_isWeighted(){if(!this.colWeights||0===this.colWeights.length)return!1;const e=this.colWeights[0];return this.colWeights.some(t=>t!==e)}_memberXs(e){if(e<=0)return[];const t=this._W;if(1===e)return[t/2];if(30!==this.margin){const i=t-2*this.margin,o=[];for(let t=0;t<e;t++)o.push(this.margin+i*t/(e-1));return o}const i=this.tileGap;if(this._isWeighted()){const o=this.colWeights,s=o.reduce((e,t)=>e+t,0),r=t-(e-1)*i,a=[];let n=0;for(let t=0;t<e;t++){const e=r*o[t]/s;a.push(n+e/2),n+=e+i}return a}const o=(t-(e-1)*i)/e,s=[];for(let t=0;t<e;t++)s.push(o/2+t*(o+i));return s}_armStroke(e){if(!e||"on"!==e.state||!e.rgb)return _e;const t=Math.max(.4,Math.min(1,(e.brightness??255)/255));return`rgba(${e.rgb[0]}, ${e.rgb[1]}, ${e.rgb[2]}, ${t.toFixed(3)})`}_armDash(e){return!e||"unavailable"!==e.state&&"unknown"!==e.state?"none":"3 8"}_bezierD(e,t){const i=this._groupX,o=this._groupY,s=t??this._memberY,r=o-s,a=o-.05*r,n=e,l=o-.5*r;return`M ${i} ${o} C ${(i+.7*(e-i)).toFixed(2)} ${a.toFixed(2)}, ${n.toFixed(2)} ${l.toFixed(2)}, ${e} ${s}`}_renderBezierArms(e){return e.map((e,t)=>{const i=this.members[t],o=this.memberYs?.[t];return q`
        <path
          d=${this._bezierD(e,o)}
          stroke=${this._armStroke(i)}
          stroke-width=${this.strokeWidth}
          stroke-dasharray=${this._armDash(i)}
          stroke-linecap="round"
          fill="none"
        />
      `})}_renderCombArms(e){if(0===e.length)return[];const t=this._memberY,i=this._groupY,o=this._groupX,s=t+.55*(i-t),r=Math.min(...e),a=Math.max(...e),n=e.map((e,i)=>{const o=this.members[i],r=this.memberYs?.[i]??t;return q`
        <line
          x1=${e}
          y1=${r}
          x2=${e}
          y2=${s}
          stroke=${this._armStroke(o)}
          stroke-width=${this.strokeWidth}
          stroke-dasharray=${this._armDash(o)}
          stroke-linecap="round"
        />
      `}),l=this.members.filter(e=>e&&"on"===e.state&&e.rgb);let d=_e;if(l.length>0){let e=0,t=0,i=0,o=0;for(const s of l)e+=s.rgb[0],t+=s.rgb[1],i+=s.rgb[2],o=Math.max(o,(s.brightness??255)/255);e=Math.round(e/l.length),t=Math.round(t/l.length),i=Math.round(i/l.length),d=`rgba(${e}, ${t}, ${i}, ${o.toFixed(3)})`}return[...n,q`
      <line
        x1=${r} y1=${s}
        x2=${a} y2=${s}
        stroke=${d}
        stroke-width=${this.strokeWidth}
        stroke-linecap="round"
      />
    `,q`
      <line
        x1=${o} y1=${s}
        x2=${o} y2=${i}
        stroke=${d}
        stroke-width=${this.strokeWidth}
        stroke-linecap="round"
      />
    `]}render(){const e=this.members.length,t=this._memberXs(e),i=this._W,o=this._H,s=this._memberY,r=this._groupX,a=this._groupY,n=e>=1?e>=this.fallbackAtN?this._renderCombArms(t):this._renderBezierArms(t):[],l=this.dotsEnabled?t.map((e,t)=>q`
            <circle
              cx=${e}
              cy=${this.memberYs?.[t]??s}
              r=${this.memberRadii?.[t]??17}
              fill="var(--mindmap-dot-fill, #3a3a52)"
              stroke=${this._armStroke(this.members[t])}
              stroke-width="2"
            />
          `):[];let d="var(--mindmap-group-stroke, #f4b91d)";!1===this.groupOn?d=_e:!0===this.groupOn&&this.groupRgb&&3===this.groupRgb.length&&(d=`rgba(${this.groupRgb[0]}, ${this.groupRgb[1]}, ${this.groupRgb[2]}, 1)`);const c=(this.groupDotEnabled??this.dotsEnabled)&&e>=1?q`
            <circle
              cx=${r}
              cy=${a}
              r=${23}
              fill="var(--mindmap-dot-fill, #3a3a52)"
              stroke=${d}
              stroke-width="2"
            />
          `:null;return G`
      <svg
        viewBox=${`0 0 ${i} ${o}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        role="img"
        aria-label=${`Mindmap with ${e} member${1===e?"":"s"}`}
      >
        <g class="arms">${n}</g>
        <g class="dots">${l}${c}</g>
      </svg>
    `}};xe.styles=a`
    :host {
      display: block;
      width: 100%;
      /* Default aspect ratio matches the design-mock for the standalone test
         page. Group-layout-expanded overrides this with aspect-ratio:auto
         and an explicit pixel height. */
      aspect-ratio: 300 / 200;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* Same depth-treatment Stefan asked for on tiles + slider, applied as an
       SVG filter on the connector arms only (NOT the placeholder dots) so the
       curves visually lift off the card. drop-shadow on the <g> applies once
       per group rather than per <path>, which is the cheaper render path. */
    .arms {
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
    }
  `,e([ge({attribute:!1})],xe.prototype,"members",void 0),e([ge({type:Boolean})],xe.prototype,"responsive",void 0),e([ge({type:Number,attribute:"view-width"})],xe.prototype,"viewWidth",void 0),e([ge({type:Number,attribute:"view-height"})],xe.prototype,"viewHeight",void 0),e([ge({type:Number,attribute:"group-x"})],xe.prototype,"groupXOverride",void 0),e([ge({type:Number,attribute:"group-y"})],xe.prototype,"groupYOverride",void 0),e([ge({type:Number,attribute:"member-y"})],xe.prototype,"memberYOverride",void 0),e([ge({type:Number,attribute:"margin"})],xe.prototype,"margin",void 0),e([ge({type:Number,attribute:"stroke-width"})],xe.prototype,"strokeWidth",void 0),e([ge({type:Number,attribute:"fallback-at"})],xe.prototype,"fallbackAtN",void 0),e([ge({type:Number,attribute:"tile-gap"})],xe.prototype,"tileGap",void 0),e([ge({attribute:!1})],xe.prototype,"memberRadii",void 0),e([ge({attribute:!1})],xe.prototype,"colWeights",void 0),e([ge({attribute:!1})],xe.prototype,"memberYs",void 0),e([ge({type:Number,attribute:"group-icon-offset"})],xe.prototype,"groupIconOffset",void 0),e([ge({type:String,attribute:"icon-position"})],xe.prototype,"iconPosition",void 0),e([ge({type:Boolean,attribute:"dots-enabled"})],xe.prototype,"dotsEnabled",void 0),e([ge({type:Boolean,attribute:"group-dot-enabled"})],xe.prototype,"groupDotEnabled",void 0),e([ge({type:Boolean,attribute:"group-on"})],xe.prototype,"groupOn",void 0),e([ge({attribute:!1})],xe.prototype,"groupRgb",void 0),e([ge({type:Boolean})],xe.prototype,"stretch",void 0),e([fe()],xe.prototype,"_measuredWidth",void 0),e([fe()],xe.prototype,"_measuredHeight",void 0),xe=e([pe("everyday-mindmap-path")],xe);function we(e,t={}){if("group-expanded"===e&&t.omitTemp)return["wheel","saved"];if("parallel-inline"===e){const e=["mindmap","saved","wheel"];return t.hasEffects&&e.push("effects"),e}const i=[t.useMindmap?"mindmap":"parallel","saved"];return t.hasEffects&&i.push("effects"),i.push("wheel"),"group-expanded"!==e&&i.push("cycle"),t.additionalMindmap&&!t.useMindmap&&(i[0]="mindmap",i.push("parallel")),t.hasCollapse&&"group-expanded"===e&&i.push("collapse"),i}function ke(e,t={}){const i=we(e,t),o={};if("group-expanded"===e&&t.omitTemp)return o.wheel=0,o.saved=180,o;if("group-expanded"===e&&4===i.length){const e={parallel:270,saved:0,wheel:90,effects:180,mindmap:180,collapse:180};for(const t of i)void 0!==e[t]&&(o[t]=e[t]);return o}const s=i.length,r=360/s;for(let e=0;e<s;e++){const t=(270+e*r)%360;o[i[e]]=t}return o}function $e(e,t,i="member",o={}){const s=ke(i,o)[e];if(void 0===s)return t;const r=s*Math.PI/180;return{x:t.x+64*Math.cos(r),y:t.y+64*Math.sin(r)}}ke("member"),ke("group-compact"),ke("group-expanded"),ke("parallel-inline");const Pe=[{mode:"temp",label:"Temp",angleDeg:210,iconPath:"M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4 4 0 1 0 5 0z M11.5 14 L11.5 8"},{mode:"saved",label:"Saved",angleDeg:330,iconPath:"7DOT"},{mode:"wheel",label:"Wheel",angleDeg:90,iconPath:"M12 3a9 9 0 1 0 0 18 c1 0 1.5 -.6 1.5 -1.5 c0 -.5 -.2 -.9 -.5 -1.2 c-.3 -.3 -.5 -.7 -.5 -1.2 c0 -.9 .6 -1.5 1.5 -1.5 H16 a5 5 0 0 0 5 -5 c0 -4 -4 -7.6 -9 -7.6 z"}];let Se=class extends ce{constructor(){super(...arguments),this.currentMode="brightness",this.hasEffects=!1,this.variant="member",this.omitTemp=!1,this.useMindmap=!1,this.additionalMindmap=!1,this.hasCollapse=!1,this.parallelExpanded=!1,this._onPick=e=>t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent("mode-pick",{detail:{mode:e},bubbles:!0,composed:!0}))}}_nextSliderMode(){if("color_temp"===this.colorMode)return"brightness"===this.currentMode?"temperature":"brightness";switch(this.currentMode){case"brightness":return"hue";case"hue":return"saturation";default:return"brightness"}}_renderIcon(e){return"cycle"===e.mode?this._renderModeIcon(this._nextSliderMode()):"temp"===e.mode&&"temperature"===this.currentMode?this._renderModeIcon("brightness"):"mindmap"===e.mode&&"parallel-inline"===this.variant&&this.parallelExpanded?this._renderRawIcon("COLLAPSE"):"7DOT"===e.iconPath?G`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
          <circle cx="19" cy="12" r="1.6" fill="currentColor"></circle>
          <circle cx="15.5" cy="18.06" r="1.6" fill="currentColor"></circle>
          <circle cx="8.5" cy="18.06" r="1.6" fill="currentColor"></circle>
          <circle cx="5" cy="12" r="1.6" fill="currentColor"></circle>
          <circle cx="8.5" cy="5.94" r="1.6" fill="currentColor"></circle>
          <circle cx="15.5" cy="5.94" r="1.6" fill="currentColor"></circle>
        </svg>
      `:"PARALLEL"===e.iconPath?G`
        <svg viewBox="0 0 24 24" class="g">
          <line x1="5"  y1="6"  x2="5"  y2="20"></line>
          <circle cx="5"  cy="9"  r="1.6" fill="currentColor"></circle>
          <line x1="11" y1="4"  x2="11" y2="20"></line>
          <circle cx="11" cy="14" r="1.6" fill="currentColor"></circle>
          <line x1="17" y1="6"  x2="17" y2="20"></line>
          <circle cx="17" cy="11" r="1.6" fill="currentColor"></circle>
        </svg>
      `:"EFFECTS"===e.iconPath?G`
        <svg viewBox="0 0 24 24" class="g">
          <line x1="5" y1="6"  x2="19" y2="6"></line>
          <line x1="5" y1="12" x2="15" y2="12"></line>
          <line x1="5" y1="18" x2="11" y2="18"></line>
          <circle cx="20" cy="12" r="1.4" fill="currentColor"></circle>
        </svg>
      `:"COLLAPSE"===e.iconPath?G`
        <svg viewBox="0 0 24 24" class="g">
          <!-- Host at TOP-center -->
          <circle cx="12" cy="4" r="2.4" fill="currentColor"></circle>
          <!-- 3 child nodes at bottom y=18 — converging into the host above -->
          <circle cx="4" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="18" r="1.8" fill="currentColor"></circle>
          <!-- Left arm: child(4,18) curving up to host(12,4) -->
          <path d="M 4 18 C 4 10 6 5 12 4" fill="none"></path>
          <!-- Center arm: vertical -->
          <path d="M 12 18 L 12 4" fill="none"></path>
          <!-- Right arm: mirror -->
          <path d="M 20 18 C 20 10 18 5 12 4" fill="none"></path>
        </svg>
      `:"MINDMAP"===e.iconPath?G`
        <svg viewBox="0 0 24 24" class="g">
          <!-- 3 child nodes at same y=6 — Stefan-flatter request -->
          <circle cx="4" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="6" r="1.8" fill="currentColor"></circle>
          <!-- Host at bottom-center -->
          <circle cx="12" cy="20" r="2.4" fill="currentColor"></circle>
          <!-- Left arm: L-shaped — host out to (4,18) horizontal, then up
               to (4,6). Control points pull the curve toward the corner. -->
          <path d="M 12 20 C 6 19 4 14 4 6" fill="none"></path>
          <!-- Center arm: pure vertical -->
          <path d="M 12 20 L 12 6" fill="none"></path>
          <!-- Right arm: mirror of left -->
          <path d="M 12 20 C 18 19 20 14 20 6" fill="none"></path>
        </svg>
      `:G`
      <svg viewBox="0 0 24 24" class="g">
        <path d=${e.iconPath}></path>
      </svg>
    `}_renderRawIcon(e){return"COLLAPSE"===e?G`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="4" r="2.4" fill="currentColor"></circle>
          <circle cx="4" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="18" r="1.8" fill="currentColor"></circle>
          <path d="M 4 18 C 4 10 6 5 12 4" fill="none"></path>
          <path d="M 12 18 L 12 4" fill="none"></path>
          <path d="M 20 18 C 20 10 18 5 12 4" fill="none"></path>
        </svg>
      `:"MINDMAP"===e?G`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="4" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="20" r="2.4" fill="currentColor"></circle>
          <path d="M 12 20 C 6 19 4 14 4 6" fill="none"></path>
          <path d="M 12 20 L 12 6" fill="none"></path>
          <path d="M 12 20 C 18 19 20 14 20 6" fill="none"></path>
        </svg>
      `:G`<svg viewBox="0 0 24 24" class="g"></svg>`}_renderModeIcon(e){return"brightness"===e?G`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="4" fill="none"></circle>
          <line x1="12" y1="3" x2="12" y2="5"></line>
          <line x1="12" y1="19" x2="12" y2="21"></line>
          <line x1="3" y1="12" x2="5" y2="12"></line>
          <line x1="19" y1="12" x2="21" y2="12"></line>
          <line x1="5.6" y1="5.6" x2="7" y2="7"></line>
          <line x1="17" y1="17" x2="18.4" y2="18.4"></line>
          <line x1="5.6" y1="18.4" x2="7" y2="17"></line>
          <line x1="17" y1="7" x2="18.4" y2="5.6"></line>
        </svg>
      `:"temperature"===e?G`
        <svg viewBox="0 0 24 24" class="g">
          <path d="M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4 4 0 1 0 5 0z M11.5 14 L11.5 8"></path>
        </svg>
      `:"hue"===e?G`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="8" fill="none"></circle>
          <path d="M 12 4 A 8 8 0 0 1 20 12" fill="none" stroke-width="2.4"></path>
          <path d="M 12 4 A 8 8 0 0 0 4 12" fill="none" stroke-width="1.4"></path>
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        </svg>
      `:G`
      <svg viewBox="0 0 24 24" class="g">
        <circle cx="12" cy="6"  r="1.6" fill="none"></circle>
        <circle cx="12" cy="11" r="2.0" fill="none" stroke-width="1.6"></circle>
        <circle cx="12" cy="17" r="2.6" fill="currentColor"></circle>
      </svg>
    `}_renderedOptions(){const e=Pe.find(e=>"wheel"===e.mode),t=Pe.find(e=>"temp"===e.mode),i=Pe.find(e=>"saved"===e.mode),o=this.omitTemp?"group-expanded":this.variant,s=we(o,{hasEffects:this.hasEffects,omitTemp:this.omitTemp,useMindmap:this.useMindmap,additionalMindmap:this.additionalMindmap,hasCollapse:this.hasCollapse}),r=ke(o,{hasEffects:this.hasEffects,omitTemp:this.omitTemp,useMindmap:this.useMindmap,additionalMindmap:this.additionalMindmap,hasCollapse:this.hasCollapse}),a={wheel:{mode:"wheel",label:e.label,iconPath:e.iconPath},saved:{mode:"saved",label:i.label,iconPath:i.iconPath},temp:{mode:"temp",label:t.label,iconPath:t.iconPath},cycle:{mode:"cycle",label:"Cycle slider mode",iconPath:"CYCLE"},parallel:{mode:"parallel",label:"Parallel sliders",iconPath:"PARALLEL"},mindmap:{mode:"mindmap",label:"Expand",iconPath:"MINDMAP"},effects:{mode:"effects",label:"Effects",iconPath:"EFFECTS"},collapse:{mode:"collapse",label:"Collapse",iconPath:"COLLAPSE"}};return s.map(e=>{const t=a[e],i=r[e];return t&&void 0!==i?{...t,angleDeg:i}:null}).filter(e=>null!==e)}render(){const e=this._renderedOptions();return G`
      <div class="picker">
        ${e.map(e=>{const t=e.angleDeg*Math.PI/180,i=64*Math.cos(t),o=64*Math.sin(t),s=this.selected===e.mode;return G`
            <button
              class="dot ${s?"sel":""}"
              style=${`left: ${i}px; top: ${o}px;`}
              type="button"
              @click=${this._onPick(e.mode)}
              @pointerdown=${e=>e.stopPropagation()}
              aria-label=${e.label}
            >
              ${this._renderIcon(e)}
            </button>
          `})}
      </div>
    `}};Se.styles=a`
    :host {
      display: block;
      position: relative;
      width: 0;
      height: 0;
      pointer-events: auto;
    }
    .picker {
      position: absolute;
      left: 0;
      top: 0;
      /* Stefan-2026-05-12 R323 (PA-0004): block mobile scroll-claim on the
         picker container. The press-drag-select gesture lives entirely inside
         this 0x0 anchor's absolute-positioned children; without touch-action
         none the browser's scroll engine claimed touches that drifted onto
         picker children, killing target-acquisition mid-drag. */
      touch-action: none;
    }
    .dot {
      position: absolute;
      width: ${40}px;
      height: ${40}px;
      transform: translate(-50%, -50%) scale(0);
      animation: bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) forwards;
      border-radius: 50%;
      border: none;
      background: var(--card-background-color, #2a2c4a);
      color: var(--state-light-active-color, #f88d2a);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 140ms ease-out, box-shadow 140ms ease-out;
      will-change: transform;
      /* Stefan-2026-05-12 R323 (PA-0004): per-dot guarantee. The bound icon
         element already declares touch-action none (see group-layout-expanded
         .tile.member + everyday-light-card .single-icon[data-interactive]),
         but as the finger moves OFF the icon and ONTO a dot, the dot needs
         its own declaration or mobile Safari/Chrome reclaim the touch for
         scrolling and dispatch pointercancel mid-drag. */
      touch-action: none;
    }
    .dot:hover {
      transform: translate(-50%, -50%) scale(1.08);
    }
    .dot.sel,
    .dot:active {
      transform: translate(-50%, -50%) scale(1.14);
      box-shadow:
        0 0 0 2px var(--state-light-active-color, #f88d2a),
        0 0 18px rgba(248, 141, 42, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.45);
    }
    .dot:focus-visible {
      outline: 2px solid var(--state-light-active-color, #f88d2a);
      outline-offset: 4px;
    }
    .g {
      width: 22px;
      height: 22px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    /* Stagger the bloom so the dots don't fire at the exact same frame -
       reads as a quick "fan out". 4-option diamond ('group-compact' variant)
       needs the 4th rule too, otherwise nth-child(4) gets animation-delay 0
       and bloomed alongside the 1st (frontend-developer + code-reviewer
       2026-05-09 P40). */
    .dot:nth-child(1) { animation-delay: 0ms; }
    .dot:nth-child(2) { animation-delay: 40ms; }
    .dot:nth-child(3) { animation-delay: 80ms; }
    .dot:nth-child(4) { animation-delay: 120ms; }
    /* Stefan-2026-05-11 R290 (PA-14): support 5- and 6-slot pickers
       (pentagon + hexagon) when additionalMindmap is set on standalone-
       compact group cards. Same 40 ms stagger so the bloom reads as
       one fan-out instead of two paired pops. R111-safe: no backticks. */
    .dot:nth-child(5) { animation-delay: 160ms; }
    .dot:nth-child(6) { animation-delay: 200ms; }

    @keyframes bloom {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      60% {
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
  `,e([ge({type:String})],Se.prototype,"selected",void 0),e([ge({type:String,attribute:"current-mode"})],Se.prototype,"currentMode",void 0),e([ge({type:String,attribute:"color-mode"})],Se.prototype,"colorMode",void 0),e([ge({type:Boolean,attribute:"has-effects"})],Se.prototype,"hasEffects",void 0),e([ge({type:String})],Se.prototype,"variant",void 0),e([ge({type:Boolean,attribute:"omit-temp"})],Se.prototype,"omitTemp",void 0),e([ge({type:Boolean,attribute:"use-mindmap"})],Se.prototype,"useMindmap",void 0),e([ge({type:Boolean,attribute:"additional-mindmap"})],Se.prototype,"additionalMindmap",void 0),e([ge({type:Boolean,attribute:"has-collapse"})],Se.prototype,"hasCollapse",void 0),e([ge({type:Boolean,attribute:"parallel-expanded"})],Se.prototype,"parallelExpanded",void 0),Se=e([pe("everyday-mode-picker")],Se);function Me(e,t,i){const o=Math.floor(6*e),s=6*e-o,r=i*(1-t),a=i*(1-s*t),n=i*(1-(1-s)*t);let l=0,d=0,c=0;switch(o%6){case 0:l=i,d=n,c=r;break;case 1:l=a,d=i,c=r;break;case 2:l=r,d=i,c=n;break;case 3:l=r,d=a,c=i;break;case 4:l=n,d=r,c=i;break;case 5:l=i,d=r,c=a}return[Math.round(255*l),Math.round(255*d),Math.round(255*c)]}function Ce(e,t,i,o){const s=Math.cos(i)*e,r=Math.sin(i)*e,a=Math.cos(o)*e,n=Math.sin(o)*e,l=Math.cos(o)*t,d=Math.sin(o)*t,c=Math.cos(i)*t,h=Math.sin(i)*t,p=o-i>Math.PI?1:0;return`M ${s} ${r} A ${e} ${e} 0 ${p} 1 ${a} ${n} L ${l} ${d} A ${t} ${t} 0 ${p} 0 ${c} ${h} Z`}let Ee=class extends ce{constructor(){super(...arguments),this.wheelType="stepped",this.hues=24,this.rings=8,this.whiteCenter=!0,this._onSegmentClick=e=>t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent("color-pick",{detail:{r:e[0],g:e[1],b:e[2]},bubbles:!0,composed:!0}))},this._onWhiteClick=e=>{e.stopPropagation(),this.dispatchEvent(new CustomEvent("color-pick",{detail:{r:255,g:255,b:255},bubbles:!0,composed:!0}))},this._onSmoothClick=e=>{const t=e.currentTarget.getBoundingClientRect(),i=t.left+t.width/2,o=t.top+t.height/2,s=e.clientX-i,r=e.clientY-o,a=Math.min(t.width,t.height)/2,n=Math.sqrt(s*s+r*r);if(n>a)return;if(n<.08*a)return void this.dispatchEvent(new CustomEvent("color-pick",{detail:{r:255,g:255,b:255},bubbles:!0,composed:!0}));let l=Math.atan2(r,s)/(2*Math.PI);l<0&&(l+=1);const d=Me(l,Math.min(1,n/a),1);this.dispatchEvent(new CustomEvent("color-pick",{detail:{r:d[0],g:d[1],b:d[2]},bubbles:!0,composed:!0}))}}render(){if("smooth"===this.wheelType)return G`
        <div class="smooth-wheel" role="img" aria-label="Color wheel" @click=${this._onSmoothClick}>
          <div class="smooth-bg"></div>
        </div>
      `;const e=Math.max(2,this.hues),t=Math.max(1,this.rings),i=this.whiteCenter&&t>5,o=[];for(let s=i?1:0;s<t;s++){const i=100/t*s,r=100/t*(s+1),a=(s+1)/t;for(let t=0;t<e;t++){const s=t/e*2*Math.PI,n=(t+1)/e*2*Math.PI,l=Me(t/e,a,1),d=`rgb(${l[0]}, ${l[1]}, ${l[2]})`;o.push(q`
          <path
            d=${Ce(i,r,s,n)}
            fill=${d}
            class="seg"
            @click=${this._onSegmentClick(l)}
          ></path>
        `)}}const s=i?q`
        <circle
          cx="0"
          cy="0"
          r=${100/t}
          fill="white"
          class="seg"
          @click=${this._onWhiteClick}
        ></circle>
      `:null;return G`
      <svg viewBox="-110 -110 220 220" role="img" aria-label="Color wheel">
        ${o}${s}
      </svg>
    `}};function Ae(e,t){const i=t.longPressMs??200,o=t.tapMaxMs??300,s=t.doubleTapMs??300,r=t.dragThresholdPx??8;let a=0,n=0,l=0,d=null,c=null,h=!1,p=0,u=null,m=null;const g=()=>{null!==c&&(clearTimeout(c),c=null)},f=()=>{null!==u&&(clearTimeout(u),u=null),m=null},v=()=>{if(null!==d)try{e.releasePointerCapture(d)}catch{}d=null},y=o=>{void 0!==o.button&&0!==o.button||(a=o.clientX,n=o.clientY,l=Date.now(),d=o.pointerId,h=!1,t.onPointerDownLock?.(o),t.onLongPress&&(g(),c=window.setTimeout(()=>{c=null,h=!0;try{e.setPointerCapture(o.pointerId)}catch{}f(),t.onLongPress?.(o)},i)))},b=e=>{if(h)return e.stopPropagation(),void t.onLongPressMove?.(e);const i=e.clientX-a,o=e.clientY-n;i*i+o*o>r*r&&g()},_=e=>{if(g(),h)return t.onLongPressEnd?.(e),void v();v(),t.onPointerDownRelease?.(e);const i=Date.now()-l,d=e.clientX-a,c=e.clientY-n;if(i>o||d*d+c*c>r*r)return;const y=Date.now();if(t.onDoubleTap&&y-p<s&&m)return f(),p=0,void t.onDoubleTap(e);p=y,t.onDoubleTap?(m=e,u=window.setTimeout(()=>{u=null;const e=m;m=null,e&&t.onTap&&t.onTap(e)},s)):t.onTap&&t.onTap(e)},x=e=>{g(),h?t.onLongPressEnd?.(e):t.onPointerDownRelease?.(e),h=!1,v()};return e.addEventListener("pointerdown",y),e.addEventListener("pointermove",b),e.addEventListener("pointerup",_),e.addEventListener("pointercancel",x),()=>{e.removeEventListener("pointerdown",y),e.removeEventListener("pointermove",b),e.removeEventListener("pointerup",_),e.removeEventListener("pointercancel",x),g(),f()}}Ee.styles=a`
    :host {
      display: block;
      width: 100%;
      /* Stefan-2026-05-12 P15.6-r64 (PA-0014): dropped max-width 320px.
         When a host set explicit width 360 + height 360, the
         320px clamp on width left height untouched, producing a
         320x360 rectangle (Stefan saw the smooth wheel "schmaler
         als hoch" on wheel-variants.html). aspect-ratio alone now
         drives height from the rendered width; the popup host
         already constrains absolute size via its own wrapper. */
      aspect-ratio: 1 / 1;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      /* Stefan-2026-05-08-evening: the wheel popup wrapper is now transparent
         (no rectangular card around the wheel), so the shadow lives entirely
         on the wheel SVG itself. Pumped strength up so the round wheel reads
         as floating above the card. */
      filter: drop-shadow(0 14px 36px rgba(0, 0, 0, 0.7))
              drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
    }
    .seg {
      cursor: pointer;
      stroke: rgba(0, 0, 0, 0.05);
      stroke-width: 0.5;
      transition: opacity 120ms ease-out, transform 120ms ease-out;
      transform-origin: center;
      transform-box: fill-box;
    }
    .seg:hover {
      opacity: 0.92;
    }
    .seg:active {
      opacity: 0.8;
    }
    /* Smooth variant: continuous HSV via CSS gradients. White center fades
       in via the radial gradient layered over the conic hue. */
    .smooth-wheel {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.45));
    }
    .smooth-bg {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background:
        radial-gradient(circle at center, #fff 0%, rgba(255, 255, 255, 0) 70%),
        conic-gradient(
          from 0deg,
          #ff0000,
          #ffff00,
          #00ff00,
          #00ffff,
          #0000ff,
          #ff00ff,
          #ff0000
        );
    }
  `,e([ge({type:String,attribute:"wheel-type"})],Ee.prototype,"wheelType",void 0),e([ge({type:Number,attribute:"hues"})],Ee.prototype,"hues",void 0),e([ge({type:Number,attribute:"rings"})],Ee.prototype,"rings",void 0),e([ge({type:Boolean,attribute:"white-center"})],Ee.prototype,"whiteCenter",void 0),Ee=e([pe("everyday-color-wheel")],Ee);let Re=class extends ce{constructor(){super(...arguments),this.colors=[],this.editMode=!1,this._gestureCleanups=[],this._onRemove=e=>t=>{t.stopPropagation(),this.dispatchEvent(new CustomEvent("remove-color",{detail:{index:e},bubbles:!0,composed:!0}))},this._onAdd=e=>{e.stopPropagation(),this.dispatchEvent(new CustomEvent("add-current",{bubbles:!0,composed:!0}))},this._onSwatchTapInEdit=e=>e=>{this.editMode&&e.stopPropagation()}}updated(){for(const e of this._gestureCleanups)e();if(this._gestureCleanups=[],this.editMode)return;this.renderRoot.querySelectorAll(".swatch[data-idx]").forEach(e=>{const t=Ae(e,{onLongPress:()=>{this.dispatchEvent(new CustomEvent("enter-edit",{bubbles:!0,composed:!0}))},onTap:()=>{const t=Number(e.dataset.idx),i=this.colors[t];if(!i)return;const o=4===i.length?i[3]:void 0;this.dispatchEvent(new CustomEvent("color-pick",{detail:{r:i[0],g:i[1],b:i[2],k:o},bubbles:!0,composed:!0}))}});this._gestureCleanups.push(t)})}disconnectedCallback(){super.disconnectedCallback();for(const e of this._gestureCleanups)e();this._gestureCleanups=[]}render(){return G`
      <div class="frame">
        <div class="grid ${this.editMode?"editing":""}">
          ${this.colors.map((e,t)=>G`
              <div
                class="swatch"
                data-idx=${t}
                style=${`background: rgb(${e[0]}, ${e[1]}, ${e[2]});`}
                @click=${this._onSwatchTapInEdit(t)}
              >
                ${this.editMode?G`
                      <button
                        class="remove"
                        type="button"
                        aria-label="Remove color"
                        @click=${this._onRemove(t)}
                      >
                        <svg viewBox="0 0 24 24" class="g">
                          <line x1="6" y1="12" x2="18" y2="12"></line>
                        </svg>
                      </button>
                    `:null}
              </div>
            `)}
          ${this.editMode?G`
                <button class="add" type="button" aria-label="Save current color" @click=${this._onAdd}>
                  <svg viewBox="0 0 24 24" class="g">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              `:null}
        </div>
      </div>
    `}};Re.styles=a`
    :host {
      display: block;
    }
    .frame {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 56px);
      grid-auto-rows: 56px;
      gap: 12px;
      justify-content: center;
    }
    .swatch {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      touch-action: none;
      transition: transform 120ms ease-out;
    }
    .swatch:hover {
      transform: scale(1.06);
    }
    .grid.editing .swatch {
      animation: wiggle 480ms cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
    }
    /* Stagger so adjacent swatches don't wiggle in lock-step. */
    .grid.editing .swatch:nth-child(2n) { animation-delay: 80ms; }
    .grid.editing .swatch:nth-child(3n) { animation-delay: 160ms; }
    .grid.editing .swatch:nth-child(4n) { animation-delay: 240ms; }
    @keyframes wiggle {
      0%, 100% { transform: rotate(-1.4deg); }
      50%      { transform: rotate(1.4deg); }
    }
    .remove {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: var(--error-color, #c62828);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      z-index: 2;
    }
    .remove:hover {
      background: #e53935;
    }
    .add {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px dashed rgba(255, 255, 255, 0.35);
      background: transparent;
      color: var(--secondary-text-color, #b1b3c8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .add:hover {
      border-color: rgba(255, 255, 255, 0.6);
      color: var(--primary-text-color, #fff);
    }
    .done {
      align-self: flex-end;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: transparent;
      color: var(--state-light-active-color, #f88d2a);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .done:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .g {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .add .g {
      width: 22px;
      height: 22px;
    }
  `,e([ge({attribute:!1})],Re.prototype,"colors",void 0),e([ge({type:Boolean,attribute:"edit-mode"})],Re.prototype,"editMode",void 0),Re=e([pe("everyday-saved-colors-picker")],Re);let Oe=class extends ce{constructor(){super(...arguments),this.effects=[],this.activeOrder=[],this.editMode=!1,this.editable=!0,this.longPressMs=200,this._gestureCleanups=new Map,this._onHostClick=e=>{if(!this.editMode)return;const t=e.target;t?.closest(".row")||this._emit("exit-edit",{})}}updated(){for(const e of this._gestureCleanups.values())e();this._gestureCleanups.clear();this.renderRoot.querySelectorAll(".row[data-effect]").forEach(e=>{const t=e.dataset.effect,i=e.classList.contains("grayed");if(!t)return;const o=Ae(e,{longPressMs:this.longPressMs,onTap:()=>{i?this._emit("restore-effect",{effect:t}):this._emit("effect-pick",{effect:t})},onLongPress:()=>{i||(this.editMode?this._emit("delete-effect",{effect:t}):this.editable&&this._emit("enter-edit",{}))}});this._gestureCleanups.set(e,o)})}disconnectedCallback(){super.disconnectedCallback();for(const e of this._gestureCleanups.values())e();this._gestureCleanups.clear()}_emit(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}_resolveOrder(){if(!this.activeOrder||0===this.activeOrder.length)return{active:[...this.effects],grayed:[]};const e=new Set(this.activeOrder),t=this.activeOrder.filter(e=>this.effects.includes(e)),i=this.effects.filter(t=>!e.has(t));return{active:t,grayed:i}}render(){const{active:e,grayed:t}=this._resolveOrder(),i=this.editMode&&t.length>0;return G`
      <div class="list" @click=${this._onHostClick}>
        ${0===e.length?G`<div class="empty">No effects available</div>`:null}
        ${e.map(e=>G`
            <div class="row" data-effect=${e}>
              <span class="name">${e}</span>
              ${this.editMode?G`<span class="hint">long-press to remove</span>`:null}
            </div>
          `)}
        ${i?G`<div class="divider" aria-hidden="true"></div>`:null}
        ${i?t.map(e=>G`
                <div class="row grayed" data-effect=${e}>
                  <span class="name">${e}</span>
                  <span class="hint">tap to restore</span>
                </div>
              `):null}
      </div>
    `}};Oe.styles=a`
    :host {
      display: block;
      max-width: 280px;
      max-height: 60vh;
      overflow-y: auto;
      background: var(--card-background-color, #1d1f3a);
      border-radius: 18px;
      padding: 10px 6px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      touch-action: none;
      color: var(--primary-text-color, #fff);
      font-family: var(--paper-font-body1_-_font-family);
      font-size: 14px;
      transition: background 120ms ease-out;
    }
    .row:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .row.grayed {
      color: var(--secondary-text-color, #888);
      opacity: 0.55;
    }
    .row.grayed:hover {
      background: rgba(255, 255, 255, 0.03);
      opacity: 0.85;
    }
    .name {
      flex: 1 1 auto;
      text-transform: capitalize;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hint {
      flex: 0 0 auto;
      font-size: 11px;
      opacity: 0.6;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 8px 12px;
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color, #888);
      font-style: italic;
      font-size: 13px;
    }
    /* Stefan-2026-05-09 P38.1 R66: no wiggle in edit-mode. */
  `,e([ge({attribute:!1})],Oe.prototype,"effects",void 0),e([ge({attribute:!1})],Oe.prototype,"activeOrder",void 0),e([ge({type:Boolean,attribute:"edit-mode"})],Oe.prototype,"editMode",void 0),e([ge({type:Boolean,attribute:"editable"})],Oe.prototype,"editable",void 0),e([ge({type:Number,attribute:"long-press-ms"})],Oe.prototype,"longPressMs",void 0),Oe=e([pe("everyday-effects-list-picker")],Oe);const Te="\n  /* Stefan-2026-05-09 P46 R27: portal is NO LONGER position:fixed. Without\n     a positioned-ancestor at portal level, children with position:absolute\n     use the initial containing block (= document) — which scrolls with the\n     page. Wheel + saved popups (which still use position:fixed for picker-\n     dot anchoring) work either way. Topology + parallel popups now scroll\n     with the page like any other in-document content. */\n  .everyday-popup-portal { pointer-events: none; }\n  .everyday-popup-portal .inplace-popup {\n    position: fixed;\n    transform: translate(-50%, -50%) scale(1);\n    transform-origin: center;\n    background: var(--card-background-color, #1d1f3a);\n    border-radius: 20px;\n    padding: 14px;\n    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    pointer-events: auto;\n    /* Stefan-2026-05-09 P47-fix: wheel + saved popups must stack ABOVE\n       topology + parallel popups (same portal, both originally z-index 99\n       → wheel rendered earlier in template → wheel sat behind). Bumping\n       to 200 keeps the picker-result chain (wheel/saved) always on top. */\n    z-index: 200;\n    animation: everyday-inplace-bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;\n  }\n  @keyframes everyday-inplace-bloom {\n    0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }\n    100% { transform: translate(-50%, -50%) scale(1);   opacity: 1; }\n  }\n  .everyday-popup-portal .inplace-popup.wheel {\n    width: 240px;\n    background: transparent;\n    padding: 0;\n    border-radius: 0;\n    box-shadow: none;\n  }\n  .everyday-popup-portal .inplace-popup.saved {\n    max-width: 280px;\n  }\n  /* Topology + parallel-sliders popups (P43 R20/R21, redesigned P45 R25/R26a).\n     Stefan-2026-05-09: popups mount at the SAME position as the underlying\n     card / slider (not viewport-centred fullscreen-modal). The body-portal\n     still lets them escape HA's transform-ancestor; we just position them\n     precisely via inline style instead of inset zero. */\n  .everyday-popup-portal .topology-popup.anchored,\n  .everyday-popup-portal .parallel-popup.anchored {\n    /* P46 R27: position absolute (not fixed) so the popup scrolls with\n       the page. Inline-style from JS supplies the actual position\n       absolute, left/top, transform translateY(-100%) etc. - see\n       _renderTopologyPopup / _renderParallelSlidersPopup. */\n    pointer-events: auto;\n    z-index: 99;\n    /* Bloom-in animation kept; chained with the inline translateY(-100%)\n       via the SAME transform property by spelling both out together\n       (translateY + scale). */\n    animation: everyday-anchored-card-in 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;\n  }\n  @keyframes everyday-anchored-card-in {\n    from { transform: translateY(-100%) scale(0.92); opacity: 0; }\n    to   { transform: translateY(-100%) scale(1);    opacity: 1; }\n  }\n  .everyday-popup-portal .popup-card {\n    background: var(--card-background-color, #1d1f3a);\n    border-radius: 24px;\n    padding: 18px 22px 22px;\n    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);\n    max-width: min(95vw, 720px);\n    max-height: 90vh;\n    overflow: auto;\n  }\n  /* Anchored variant: card fills the popup container (which is already\n     sized to match the underlying card/slider). */\n  .everyday-popup-portal .popup-card.anchored-card {\n    width: 100%;\n    height: 100%;\n    max-width: none;\n    max-height: none;\n    padding: 0;\n    display: flex;\n    flex-direction: column;\n    justify-content: flex-end;  /* group-icon at popup-bottom */\n  }\n  .everyday-popup-portal .popup-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    margin-bottom: 16px;\n  }\n  .everyday-popup-portal .popup-title {\n    font-size: 16px;\n    font-weight: 500;\n    color: var(--primary-text-color, #fff);\n  }\n  .everyday-popup-portal .popup-close {\n    width: 32px;\n    height: 32px;\n    border-radius: 50%;\n    border: none;\n    background: rgba(255, 255, 255, 0.06);\n    color: var(--primary-text-color, #fff);\n    font-size: 22px;\n    line-height: 1;\n    cursor: pointer;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n  }\n  .everyday-popup-portal .popup-close:hover {\n    background: rgba(255, 255, 255, 0.12);\n  }\n  /* Topology popup — Stefan-2026-05-09 P44 R23: re-use the inline-expand\n     layout exactly. The CSS rules below are scoped DUPLICATES of the host's\n     shadow-root rules (.layout, .topology, .tile, .member-cols, etc.) so\n     the body-portal-rendered topology-tree looks identical to the\n     in-card inline-expand version. Keep this block in sync with the host's\n     static styles when those change. The default\n     --everyday-slider-height: 170 px applies; the popup-card opt-in\n     overrides via inline style when full_length_sliders is true. */\n  .everyday-popup-portal .topology-popup-card {\n    --everyday-slider-width: 47px;\n    --everyday-slider-height: 170px;\n    --everyday-slider-shadow-y1: -4px;\n    --everyday-slider-shadow-y2: -14px;\n    padding: 18px 22px 22px;\n    /* Stefan-2026-05-09 P47-fix: topology-popup is transparent so the\n       original card / wallpaper shows through. Sliders + tiles still\n       render solid; only the popup-card chrome is invisible. */\n    background: transparent;\n    box-shadow: none;\n  }\n  .everyday-popup-portal .topology-popup-card .layout {\n    /* Stefan-2026-05-09 P47 R30: top-padding 111 px brings the anchor\n       (group-icon at popup-bottom) to align with the original card's\n       group-icon-y. Inline-expand .layout keeps the original 24/24/20\n       padding — only the popup variant needs the larger top-padding to\n       compensate for the popup's translateY(-100%) bottom-anchor model. */\n    display: flex;\n    flex-direction: column;\n    gap: 14px;\n    padding: 111px 24px 24px;\n  }\n  .everyday-popup-portal .topology-popup-card .topology {\n    position: relative;\n    display: flex;\n    flex-direction: column;\n    gap: 30px;\n  }\n  .everyday-popup-portal .topology-popup-card .topology > .topology-bg {\n    position: absolute;\n    inset: 0;\n    width: 100%;\n    height: 100%;\n    aspect-ratio: auto;\n    display: block;\n    z-index: 0;\n    pointer-events: none;\n  }\n  .everyday-popup-portal .topology-popup-card .topology > .group-row,\n  .everyday-popup-portal .topology-popup-card .topology > .member-cols {\n    position: relative;\n    z-index: 2;\n  }\n  .everyday-popup-portal .topology-popup-card .group-row {\n    display: flex;\n    justify-content: center;\n  }\n  .everyday-popup-portal .topology-popup-card .member-cols {\n    display: grid;\n    grid-template-columns: repeat(var(--member-count, 1), 1fr);\n    gap: 18px;\n    justify-items: center;\n  }\n  .everyday-popup-portal .topology-popup-card .member-col {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 8px;\n  }\n  .everyday-popup-portal .topology-popup-card .tile {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 4px;\n    position: relative;\n  }\n  .everyday-popup-portal .topology-popup-card .tile .ic {\n    width: 34px;\n    height: 34px;\n    border-radius: 50%;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: transparent;\n    color: var(--secondary-text-color);\n    transition: color 200ms ease, background 160ms ease;\n  }\n  .everyday-popup-portal .topology-popup-card .tile.group .ic {\n    width: 46px;\n    height: 46px;\n  }\n  .everyday-popup-portal .topology-popup-card .tile .ic ha-icon,\n  .everyday-popup-portal .topology-popup-card .tile .ic .compact-glyph {\n    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55));\n  }\n  .everyday-popup-portal .topology-popup-card .tile.on .ic {\n    color: var(--state-light-active-color, #f88d2a);\n  }\n  .everyday-popup-portal .topology-popup-card .tile .lbl {\n    font-size: 12px;\n    color: var(--secondary-text-color);\n    text-align: center;\n    max-width: 80px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n  .everyday-popup-portal .topology-popup-card .tile.group {\n    cursor: pointer;\n    user-select: none;\n  }\n  .everyday-popup-portal .topology-popup-card .tile.member.lp .ic,\n  .everyday-popup-portal .topology-popup-card .tile.group.lp .ic {\n    background: rgba(248, 141, 42, 0.20);\n    box-shadow:\n      inset 0 0 0 1px rgba(248, 141, 42, 0.50),\n      0 0 0 4px rgba(248, 141, 42, 0.18),\n      0 0 0 9px rgba(248, 141, 42, 0.08);\n  }\n  .everyday-popup-portal .topology-popup-card .tile.member {\n    cursor: pointer;\n    user-select: none;\n    touch-action: none;\n  }\n  /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): mirror onto group tiles too.\n     Same rationale as .tile.member — bound element must declare touch-action\n     before pointerdown (W3C pointer-events-3 freeze rule). */\n  .everyday-popup-portal .topology-popup-card .tile.group {\n    touch-action: none;\n  }\n  .everyday-popup-portal .topology-popup-card .compact-glyph {\n    width: 32px;\n    height: 32px;\n  }\n  .everyday-popup-portal .topology-popup-card ha-icon {\n    --mdc-icon-size: 24px;\n  }\n  .everyday-popup-portal .topology-popup-card .tile.group ha-icon {\n    --mdc-icon-size: 32px;\n  }\n  .everyday-popup-portal .topology-popup-card .picker-overlay {\n    position: absolute;\n    top: 17px;\n    left: 50%;\n    width: 0;\n    height: 0;\n    pointer-events: none;\n    z-index: 10;\n  }\n  .everyday-popup-portal .topology-popup-card .tile.group .picker-overlay {\n    top: 23px;\n  }\n  .everyday-popup-portal .topology-popup-card .picker-overlay > everyday-mode-picker {\n    pointer-events: auto;\n  }\n  /* Parallel-sliders body — N sliders side-by-side. Stefan-2026-05-09 P47\n     R31a: SLIDERS at the bottom-edge of the popup (= anchor-y), labels\n     above. justify-content:flex-end on parallel-card pushes everything\n     to the bottom; parallel-col is flex-column with label first then\n     slider, so slider sits at column-bottom. */\n  .everyday-popup-portal .parallel-card.anchored-card {\n    /* Reset the parent anchored-card padding to 0 since we want the\n       sliders flush with the popup-bottom; per-col gap handles spacing. */\n    padding: 0;\n  }\n  .everyday-popup-portal .parallel-body {\n    display: flex;\n    gap: 22px;\n    align-items: flex-end;\n    justify-content: center;\n    width: 100%;\n    height: 100%;\n  }\n  .everyday-popup-portal .parallel-col {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 8px;\n    /* Slider sits at the bottom of its column → label flows on top. */\n  }\n  .everyday-popup-portal .parallel-lbl {\n    font-size: 11px;\n    color: var(--secondary-text-color, #b1b3c8);\n    text-transform: capitalize;\n  }\n";function Ie(e,t,i,o){if(!e)return"";if("on-state"===e){if(!t||!i||3!==i.length)return"";const e=Math.max(.4,Math.min(1,(o??255)/255));return`color: rgba(${i[0]}, ${i[1]}, ${i[2]}, ${e.toFixed(3)});`}return`color: ${e};`}const ze=[1.75,1.75,.875,.375,.25],De=[28,28,14,8,6];function Le(e){if(!Number.isFinite(e))return 0;const t=Math.floor(e);return t<0?0:t>=ze.length?ze.length-1:t}function Ne(e){const t=Le(e.depth),i=De[t],o=Math.min(3,i),s=e.childCount,r=e.containerWidth,a=e.baselineSliderWidth,n=function(e){const t=Le(e.depth),i=De[t],o=Math.min(3,i);if(!Number.isFinite(e.containerWidth)||e.containerWidth<=0)return i;const s=8*ze[t]*(e.containerWidth/600);return Math.max(o,Math.min(i,s))}({depth:e.depth,containerWidth:r});if(!Number.isFinite(r)||r<=0||s<=1||!Number.isFinite(a)||a<=0)return{gap:n};if(s*a+(s-1)*n<=r+.5)return{gap:n};const l=s-1,d=(r-s*a)/l;if(d>=o)return{gap:d};const c=Math.floor((r-l*o)/s);return{gap:o,sliderOverride:Math.max(24,c)}}const He=a`
    :host {
      display: block;
      /* Stefan-2026-05-11 P15.6-r63d (R300a / PA-0031): bumped default
         from 47 → 60 px so compact-group sliders (60 px) and expanded
         group-member sliders match in width. Stefan: "B width should
         be 60px as well" — option B (expanded follows compact). The
         per-N responsiveSliderWidth shrink in group-layout-expanded.ts
         starts from this base (60) and clamps down to a 40 px floor
         for very-many-leaves groups (apartment view's 14 leaves). */
      --everyday-slider-width: 60px;
      --everyday-slider-height: 170px;
      /* Default outer-shadow direction: positive Y (cast downward). The
         'bottom' iconPosition override below flips them so the slider
         shadow casts UPWARD - reads as if light comes from the group icon
         below (Stefan 2026-05-08-night). */
      --everyday-slider-shadow-y1: 4px;
      --everyday-slider-shadow-y2: 14px;
    }
    /* Stefan-2026-05-11 R235-237: when embedded inside a parent layout
       (nested-group member-tile), reset the standalone host defaults so
       the embedded card inherits the parent's slider sizing context.
       Matches the slider heights of sibling member-cols (220 px or
       whatever the parent's full_length_sliders resolved to).
       'unset' on a custom property falls back to the inherited value
       which here is the parent layout's .layout style attribute. */
    :host([embedded]) {
      --everyday-slider-width: unset;
      --everyday-slider-height: unset;
    }
    /* Stefan-2026-05-11 P15.6-r63a (R292 / PA-0019): depth-scaled
       --member-cols-gap so intra-group siblings (deep) sit tighter
       than inter-group boundaries (shallow). Stefan PA-14 spec: gap
       between intra-group sibs MUST be strictly less than between
       cross-group sibs. Defaults: depth 0 (outermost) = 28 px, depth
       1 = 14 px, depth 2 = 8 px, depth 3+ inherits via the fallback
       4 px. Plumbed via the depth property on the host card chain
       (everyday-light-card.depth -> group-layout-expanded.depth via
       attribute reflection).

       Stefan-2026-05-12 P15.6 R299 (PA-0041): these rules are now the
       PRE-MEASUREMENT FALLBACK only. group-layout-expanded.ts measures
       its .member-cols clientWidth via ResizeObserver, runs the
       computeMemberColsGap helper, and writes the result as an inline
       --member-cols-gap on .layout (which overrides this cascade for
       descendants). Until the first RO callback fires (one frame
       after firstUpdated), the :host([depth=N]) values below keep the
       initial paint visually identical to pre-R299 — no FOUC. The
       dynamic values track the same depth ratios (28:14:8:4:2) scaled
       by container width. */
    /* Stefan-2026-05-12 R337 (PA-0016): depth-0 == depth-1 (both 14 px).
       Stefan-Quote: "the gap between Hall door and Main desk should be
       the same size as the gap between kitchen counter and bathroom
       mirror" → root-level inter-group boundary == within-Back boundary.
       Deeper levels (depth 2+) collapse toward the GAP_FLOOR (3 px) for
       within-deep-group leaves. Mirrors GAP_RATIOS / GAP_MAX_BY_DEPTH in
       helpers/member-cols-gap.ts. Used only for the pre-measurement first
       paint; ResizeObserver replaces these once the container is sized. */
    :host([depth='0']) { --member-cols-gap: 14px; }
    :host([depth='1']) { --member-cols-gap: 14px; }
    :host([depth='2']) { --member-cols-gap: 7px; }
    :host([depth='3']),
    :host([depth='4']),
    :host([depth='5']) { --member-cols-gap: 3px; }
    /* Also remove the compact-slider's standalone 260 px override when
       embedded — the embedded compact card lives in a member-col and
       must match the sibling expanded-member sliders, not the
       standalone-compact 260 px.
       Stefan-2026-05-11 R280 (PA-13 follow-up): also unset the R274
       standalone-compact width override (60 px). Embedded compact
       sliders must inherit the parent's --everyday-slider-width (24 px
       in the apartment view) so all leaf sliders are visually uniform.
       Pre-R280, hall_spots + kitchen_ceiling rendered at 60 px while
       sibling leaves were 24 px — visible width-mismatch Stefan would
       have flagged on next review. */
    :host([embedded]) .layout.compact .compact-slider-el {
      --everyday-slider-height: unset;
      --everyday-slider-width: unset;
    }
    /* Stefan-2026-05-11 R237: the decorative compact-mindmap-arm (the
       short SVG hint below the compact-slider) is redundant when
       embedded — the parent layout already draws a mindmap arm leading
       to this tile. Hiding it removes the extra vertical box that was
       making the embedded compact card taller than its siblings. */
    :host([embedded]) .layout.compact .compact-mindmap-arm {
      display: none;
    }
    /* Stefan-2026-05-11 R237: when embedded, the .layout's reserved
       min-height (380 px standalone default) makes the embedded card
       way taller than sibling member-cols. Drop the min-height so the
       layout shrinks to its content + matches sibling height. */
    :host([embedded]) .layout {
      min-height: 0;
      padding: 0;
      gap: 8px;
    }
    /* Stefan-2026-05-11 R240: defensive — make sure the embedded
       group-tile sits above any overlapping outer-mindmap SVG arms
       and receives pointer events. The outer mindmap-path SVG has
       pointer-events: none in normal flow, but with the new larger
       member-radii from r51 the dots can visually overlap the
       embedded card's group-tile area. This rule makes the embedded
       group-tile explicitly interactive so long-press → mode-picker
       fires reliably. */
    :host([embedded]) .tile.group {
      pointer-events: auto;
      position: relative;
      z-index: 5;
    }
    /* Stefan-2026-05-11 R241/R242: when embedded with icon_position='top',
       the embedded group-row sits at the TOP of the embedded card so
       it aligns with the outer's memberY (where the outer mindmap arm
       terminates). Reduce the topology gap so the group-icon doesn't
       float visually distant from its members below. */
    :host([embedded][icon-position='top']) .topology {
      gap: 12px;
    }
    /* Shadow direction flip when group icon sits at the bottom. Stefan's
       visual narrative: the group icon = light source, so sliders cast
       their shadow AWAY from the group. */
    :host([icon-position='bottom']) {
      --everyday-slider-shadow-y1: -4px;
      --everyday-slider-shadow-y2: -14px;
    }
    .layout {
      display: flex;
      flex-direction: column;
      gap: 14px;
      /* Stefan-2026-05-11 P15.6-r63e (R303 / PA-0032): padding parity with
         .layout.compact (was 16 px). Stefan-Quote: ".layout.compact and
         .layout must have the same amount of padding (24px)!!". Pre-r63e
         the bottom edge was 20 px (asymmetric for the legacy mindmap-arm
         clearance); r63e drops the asymmetry. */
      padding: 24px;
    }
    /* Stefan-2026-05-09 P42 R16 — group-icon-anchor stability across
       compact ↔ expanded transitions for the DEFAULT 'bottom' icon-position.
       Root cause of the recurring bug: with default flex-column flow, the
       card grows DOWNWARD when content (member-cols + topology-gap) is
       added on expand, so the bottom-anchored host icon shifts to a new
       viewport-y. A previous fix (P32 2026-05-08) only addressed this for
       icon-position='top' by reordering the topology — the default 'bottom'
       was never repaired.
       GAP-CLOSURE: introduce a SHARED min-height (--everyday-card-min-height)
       that BOTH compact AND expanded modes consume. Compact mode reserves
       empty space at the top; expanded mode fills it with content. The
       host icon stays at the same viewport-y regardless of mode.
       Default 380 px is enough for 3 members in expanded view. Override per
       card via CSS var. The justify-content flex-end pins content to
       the bottom of the reserved space so the host stays anchored. */
    :host([icon-position='bottom']) .layout,
    .layout {
      min-height: var(--everyday-card-min-height, 380px);
      justify-content: flex-end;
    }
    :host([icon-position='top']) .layout {
      /* 'top' anchors host at top instead — shared min-height still applies
         so compact↔expanded transitions don't shrink the card. */
      justify-content: flex-start;
    }
    /* Stefan-2026-05-11 R274 (PA-13 Issue 5): standalone compact view
       must visually match single-light — single-light has NO min-height
       reservation, it sizes to content (slider + caption). Drop the 380 px
       reservation here. The cross-mode (compact↔expanded) icon-Y stability
       documented in P42 R16 no longer applies because compact-mode now
       collapses to a single-light-equivalent tile. Embedded compact already
       has min-height: 0 via the :host([embedded]) rule above.
       Stefan-2026-05-11 P15.6-r63e (R303 / PA-0032): bumped padding 16 →
       24 px to match .layout (which is also 24 px in r63e). Stefan-Quote:
       ".layout.compact and .layout must have the same amount of padding
       (24px)!!". */
    .layout.compact {
      min-height: 0;
      justify-content: flex-start;
      padding: 24px;
    }
    /* Compact view: single group slider + group tile, no member rows.
       Stefan-2026-05-11 R274 (PA-13 Issue 5): compact view MUST visually
       match a single-light tile. Single-light layout =
       .container.vertical with gap 12 + padding 16, slider on top, then
       .caption block with [single-icon, name, state]. Mirror those values
       so a "group.layout: compact" config and the equivalent single-light
       config render identically. */
    .layout.compact {
      align-items: center;
      gap: 12px;
      position: relative;
    }
    .layout.compact .compact-slider {
      display: flex;
      justify-content: center;
    }
    .layout.compact .tile.group.compact-target {
      position: relative;
      z-index: 1;
      /* Stefan-2026-05-12 P15.6-r63i (R310): R274's 2 px gap reverted to
         the default .tile { gap: 4px } now that the compact-state-line is
         removed. icon + name with 4 px between them matches the single-
         light caption sans-state-line. */
    }
    /* Stefan-2026-05-11 R274 (PA-13 Issue 5): compact-slider sizing now
       MATCHES the single-light slider. Single-light uses 60 × 220 px
       (from the vertical-pill-slider :host fallbacks). The earlier
       260 px compact-tall override created a visual mismatch Stefan
       wants gone. Embedded compact cards still inherit unset from
       the :host([embedded]) rule above, so nested-compact members
       follow the parent layout's sizing. */
    /* Stefan-2026-05-12 PA-0002: default 220 -> 270 to match the new
       universal slider default. Uses var(...) with 270 fallback so the
       host slider.height config still cascades down via the .layout
       inline-style --everyday-slider-height override set by
       group-layout-expanded.ts:1621. Pre-PA-0002 the hardcoded 220 here
       won over the host override - Stefan-Quote (config2.txt repro):
       slider.height: 270 was silently ignored for compact-collapsed view
       because of this more-specific rule. */
    .layout.compact .compact-slider-el {
      --everyday-slider-width: 60px;
      --everyday-slider-height: var(--everyday-slider-height, 270px);
    }
    /* Stefan-2026-05-09 P45 R25: when the topology-popup is open, hide the
       compact slider so the popup at the same screen position visually
       replaces it. Visibility (not display:none) keeps the layout slot
       reserved — no reflow when the popup mounts/unmounts. */
    .compact-slider.popup-hidden {
      visibility: hidden;
    }
    /* Stefan-2026-05-10 R150: compact-glyph is now a ha-icon (was
       inline SVG). ha-icon sizes via --mdc-icon-size CSS var, so the
       explicit width/height becomes a sizing-hint AND a guaranteed
       click area. */
    .compact-glyph {
      --mdc-icon-size: 32px;
      width: 32px;
      height: 32px;
    }
    .placeholder {
      padding: 24px;
      color: var(--secondary-text-color);
    }
    /* Member columns: N grid columns, each holds [slider on top, tile on
       bottom]. This is the post-2026-05-08-evening layout that puts the
       slider directly above its tile (Stefan: "die slider auf dem Kopf"
       feedback on the prior layout where sliders were below tiles). */
    .member-cols {
      display: grid;
      /* Stefan-2026-05-11 R253: weighted columns when nested members have
         varying subtree-depths. --member-cols-template defaults to
         repeat(N, 1fr) for the equal-columns case but is overridden by
         the host to fr-weighted values when leaf-counts differ. */
      grid-template-columns: var(--member-cols-template, repeat(var(--member-count, 1), 1fr));
      /* Stefan-2026-05-11 P15.6-r63a R292 (PA-0019): depth-scaled gap.
         Honors --member-cols-gap set by the :host([depth='N']) rules
         below. Stefan-confirmed defaults: 28 px (depth 0 outer) -> 14 px
         (depth 1) -> 8 px (depth 2) -> 4 px (depth 3+). Intra-group sibs
         (deeper) get tighter gaps, inter-group boundaries (shallower)
         get wider ones — the visual rule from PA-14 R292. Pre-r63a was
         uniform 18 px regardless of depth (R270 revert from r62).
         Stefan-2026-05-12 P15.6 R299 (PA-0041): the variable is now
         dynamically overridden by the inline-style on .layout once
         ResizeObserver has measured the container. The
         :host([depth=N]) rules below seed the value for the first
         paint. */
      gap: var(--member-cols-gap, 18px);
      /* Stefan-2026-05-11 R271: stretch cols to fill the grid container
         width. Was justify-items center which kept cols at their
         content-width, centered in cells - visible as a big empty
         channel between Back's cluster and Main's cluster in the
         apartment view. With stretch + the weighted grid-template
         (8fr/6fr outer, 2fr/3fr/3fr Back-inner, etc.), every leaf col
         settles at ~1/14 of the outer card width - sliders evenly
         distributed across the full card with dynamic per-col empty
         space + the explicit 18 px col-gap. Slider stays 47 px and
         is horizontally centered inside its now wider col. Stefan
         PA-12: die slider sollen sich ueber die ganze breite der Karte
         verteilen. */
      justify-items: stretch;
      /* Stefan-2026-05-11 R262: align-items: start disables the grid's
         default stretch so each col sizes to its content height. Without
         stretch, shallow members (Main, 1-level deep) and deep members
         (Back, 2-3 levels deep) each occupy their intrinsic height in
         the row. All cols sit at row-top so their sliders are TOP-aligned,
         while their content-bottoms (and thus group-icons) sit at
         different Ys based on depth - matching Stefan's PA-09 wish
         "die höhe der dots für main und back muss unterschiedlich sein
         weil Main viel höher ist als Back". The mindmap dots track each
         icon-Y per-member via the memberYs[] prop. */
      align-items: start;
    }
    .member-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px; /* slider → tile spacing */
      /* Stefan-2026-05-11 R259: revert R258 flex-end + height:100%.
         R258 packed bare-member sliders to col-bottom which broke
         top-alignment with sibling sliders (Stefan PA-09: "hall boxes,
         door und kitchen counter sind nicht mehr top aligned"). Each col
         now sizes to its content (slider+tile for bare, embedded card
         for nested) and sits at row-top via .member-cols align-items:
         start. Mindmap dots align via per-member-Y (memberYs prop). */
      /* Stefan-2026-05-11 R276 (PA-13 Issue 1+2): grid items default to
         min-width: auto (= min-content of children). The slider's 47 px
         host width forced each leaf col to be at least 47 px wide, so
         the fr-distribution (8fr/6fr outer, 2fr/3fr/3fr inner, etc.)
         was overridden when the outer card was narrow. Resetting
         min-width:0 lets fr-shares win; the slider auto-shrinks via the
         R276 totalLeafCount-aware responsiveSliderWidth so leaf cols
         settle at uniform pitches across every group. */
      min-width: 0;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    /* Tile-icon dimensions match the mindmap-path dot radii so the long-press
       feedback (orange tint inside the .ic) sits at exactly DEFAULT_MEMBER_R
       on members and DEFAULT_GROUP_R on the group icon. Stefan-2026-05-09. */
    .tile .ic {
      width: 34px;  /* = 2 × DEFAULT_MEMBER_R (17) */
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--secondary-text-color);
      transition: color 200ms ease, background 160ms ease;
    }
    /* Drop-shadow on the icon glyph itself - replaces the disc-background
       look with a free-floating icon. Applied to both ha-icon (member tiles
       in expanded) and the inline ceiling-light SVG (group tile in compact
       and expanded). */
    .tile .ic ha-icon,
    .tile .ic .compact-glyph {
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55));
    }
    /* Stefan-2026-05-11 P15.6-r63e (R304 / PA-0032): unified --active-color
       resolution chain across .single-icon (everyday-light-card.ts), .parallel-
       mindmap-icon (everyday-light-card.ts), and .tile .ic here. Pre-r63e
       this used --state-light-active-color directly without falling through
       --paper-item-icon-active-color first, so users setting the theme's
       --active-color via --paper-item-icon-active-color saw it applied on
       single-light cards but NOT on group + member icons. Stefan-Quote:
       "please can you make all icons behave the same? ... doesnt require
       many different implementaions to do one thing". */
    .tile.on .ic {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    /* Stefan-2026-05-12 P15.6-r63l (R316 / PA-0043): when the host card sets
       show_icons: false, the .topology gets .hide-icons class which hides
       every .ic + .compact-glyph inside it. Labels stay (Stefan-Quote: "to
       disable the icons completely"). Drops layout-space too so the tile
       shrinks to just the label height. */
    .topology.hide-icons .ic,
    .topology.hide-icons .compact-glyph {
      display: none;
    }
    .tile .lbl {
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tile.group {
      cursor: pointer;
      user-select: none;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): bind-target for both
         _bindExpandedGroupGestures + _bindCompactGestures. touch-action is
         determined by the browser at the FIRST pointerdown (W3C pointer-
         events-3 spec, frozen thereafter for the gesture's lifetime). R323's
         runtime scroll-lock acquired at the 200ms long-press timer fires too
         late — by then iOS Safari + Android Chromium have already committed
         to a scroll. Matches .tile.member at line 469. */
      touch-action: none;
    }
    .tile.group .ic {
      width: 46px;  /* = 2 × DEFAULT_GROUP_R (23) */
      height: 46px;
    }
    .tile.group:focus-visible .ic {
      outline: 2px solid var(--accent-color, #f88d2a);
      outline-offset: 2px;
    }
    /* Compact-collapsed group tile: matches the single-light
       .caption .single-icon circle exactly so a group.layout=compact config
       renders identically to a light.<member> single-light tile.
       Stefan-2026-05-11 R274 (PA-13 Issue 5). Pre-R274 had transparent
       bg + box-shadow (R142) which relied on the SVG groupDot underneath
       (now removed with the arm). Solid dark fill + gold border matches
       the mindmap-node visual identity Stefan picked for single-light
       in P47-fix R52. */
    .layout.compact .tile.group.compact-target .ic {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      box-sizing: border-box;
      box-shadow: none;
    }
    /* Drop the drop-shadow on the inner glyph for compact mode — the
       solid disc with gold border carries the visual weight; the
       drop-shadow was tuned for the floating-glyph look. */
    .layout.compact .tile.group.compact-target .ic .compact-glyph,
    .layout.compact .tile.group.compact-target .ic ha-icon {
      filter: none;
    }
    /* Topology stack: group-row (top) → curve traversal area → member-cols
       (bottom). Mindmap SVG is absolutely positioned behind everything; arms
       terminate at the TOP of each member column (= top of slider). */
    .topology {
      position: relative;
      display: flex;
      flex-direction: column;
      /* Stefan-2026-05-12 R339 (PA-0016): -20% topology gap (30→24 px) to
         "stauche die ganze mindmap ein bisschen". Pulls the parent
         group-icon (Back / Apartment) ~6 px closer to its children below,
         compressing the overall mindmap vertical envelope. The mindmap-
         path SVG (CalledRender by .topology > .topology-bg below) recomputes
         its viewBox + arm geometry off this gap automatically since it
         inherits from the .topology containing-block height. */
      gap: 24px; /* group-row → member-cols, where the mindmap arms live */
    }
    .topology > .topology-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      display: block;
      z-index: 0;
      pointer-events: none;
    }
    .topology > .group-row,
    .topology > .member-cols {
      position: relative;
      z-index: 2;
    }
    .group-row {
      display: flex;
      justify-content: center;
    }
    /* HA's <ha-icon> uses --mdc-icon-size for sizing. */
    ha-icon {
      --mdc-icon-size: 24px;
    }
    .tile.group ha-icon {
      --mdc-icon-size: 32px;
    }

    /* Long-press feedback: combine an inset orange tint with layered outer
       rings that bleed past the .ic boundary. Stefan-2026-05-09-late wants
       the glow to extend "etwas über DEFAULT_MEMBER_R rand hinaus" - the
       outer rings reach up to 9 px beyond the .ic edge (= radius 17 + 9 =
       26 for member, 23 + 9 = 32 for group). Same numbers work for both
       since the rings are absolute px, not radius-relative. */
    .tile.member.lp .ic,
    .tile.group.lp .ic {
      background: rgba(248, 141, 42, 0.20);
      box-shadow:
        inset 0 0 0 1px rgba(248, 141, 42, 0.50),
        0 0 0 4px rgba(248, 141, 42, 0.18),
        0 0 0 9px rgba(248, 141, 42, 0.08);
    }
    .tile.member {
      cursor: pointer;
      user-select: none;
      touch-action: none; /* let gesture-detector own pointer events */
    }
    /* The mode-picker overlay is positioned at the icon center; the picker
       component renders its three orbits absolutely from there. Top = 17 px
       matches the 34 × 34 member .ic centre. Group tile uses 23 px to match
       its 46 × 46 .ic. */
    .picker-overlay {
      position: absolute;
      top: 17px;
      left: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 10;
    }
    .tile.group .picker-overlay {
      top: 23px;
    }
    /* Group tile is also a positioning context for its picker-overlay. */
    .tile.group {
      position: relative;
    }
    .picker-overlay > everyday-mode-picker {
      pointer-events: auto;
    }
    /* Tile is the picker's positioning context. */
    .tile.member {
      position: relative;
    }

    /* In-place popup for color-wheel + saved-colors. Fixed-position so it
       escapes any ancestor with overflow:hidden (HA cards default to clipped).
       Centered on the picker DOT (Stefan 2026-05-08: "Mitte vom color-wheel
       über dem color-wheel icon"). Bloom animation expands from center. */
    .inplace-popup {
      position: fixed;
      transform: translate(-50%, -50%) scale(1);
      transform-origin: center;
      background: var(--card-background-color, #1d1f3a);
      border-radius: 20px;
      padding: 14px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 99;
      animation: inplace-bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;
    }
    @keyframes inplace-bloom {
      0% {
        transform: translate(-50%, -50%) scale(0.4);
        opacity: 0;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
    /* Stefan-2026-05-08-evening: the wheel popup should be just the wheel
       itself with a strong shadow - no rectangular card frame around it.
       Override the default .inplace-popup background/padding/box-shadow.
       The drop-shadow on the wheel SVG itself (in color-wheel.ts) carries
       the depth treatment. */
    .inplace-popup.wheel {
      width: 240px;
      background: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .inplace-popup.saved {
      max-width: 280px;
    }

    /* Transient toast for the saved-colors stub etc. */
    .toast {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.78);
      color: #fff;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.02em;
      animation: toast-in 180ms ease-out;
      pointer-events: none;
      z-index: 10;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translate(-50%, 8px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
  `;function je(e,t){return"on"===e?.states[t]?.state}function Be(e,t,i){if(!t||!t.source)return null;if("static"===t.source){if(t.static&&t.static.length>0){const e=t.static.map(e=>[e[0],e[1],e[2]]);return Ve(e,i)?e:null}return null}if("string"==typeof t.source&&t.source.startsWith("helper:")){const o=t.source.substring(7),s=e?.states[o]?.state;if(!s||"unknown"===s||"unavailable"===s)return null;try{const e=JSON.parse(s);if(!Array.isArray(e))return null;const t=[];for(const i of e){if(!Array.isArray(i))continue;i.length>=3&&"number"==typeof i[0]&&i[0]>=0&&i[0]<=255&&"number"==typeof i[1]&&i[1]>=0&&i[1]<=255&&"number"==typeof i[2]&&i[2]>=0&&i[2]<=255&&(4===i.length&&"number"==typeof i[3]&&i[3]>=1e3&&i[3]<=1e4?t.push([i[0],i[1],i[2],i[3]]):t.push([i[0],i[1],i[2]]))}return t.length>0&&Ve(t,i)?t:null}catch{return null}}return null}function We(e,t,i){if(!t||"string"!=typeof t.source||!t.source.startsWith("helper:"))return null;const o=t.source.substring(7),s=JSON.stringify(i),r=e?.states[o],a=r?.attributes?.max??100;return s.length>a?{overflow:{helperId:o,length:s.length,max:a}}:(e?.callService("input_text","set_value",{entity_id:o,value:s}),{ok:!0})}const Ue="everyday_light_card";async function Ge(e,t){if(!e||!t)return null;try{const i=await e.callWS({type:"frontend/get_user_data",key:Ue}),o=i?.value?.saved_colors;return o&&o[t]?function(e){if(!Array.isArray(e))return[];const t=[];for(const i of e)Array.isArray(i)&&i.length>=3&&"number"==typeof i[0]&&i[0]>=0&&i[0]<=255&&"number"==typeof i[1]&&i[1]>=0&&i[1]<=255&&"number"==typeof i[2]&&i[2]>=0&&i[2]<=255&&(4===i.length&&"number"==typeof i[3]&&i[3]>=1e3&&i[3]<=1e4?t.push([i[0],i[1],i[2],i[3]]):t.push([i[0],i[1],i[2]]));return t}(o[t]):null}catch{return null}}async function qe(e,t,i){if(!e||!t)return null;try{const o=await e.callWS({type:"frontend/get_user_data",key:Ue}),s=o?.value??{},r={...s,saved_colors:{...s.saved_colors??{},[t]:i}};return await e.callWS({type:"frontend/set_user_data",key:Ue,value:r}),{ok:!0}}catch{return null}}function Ve(e,t){if(e.length!==t.length)return!0;for(let i=0;i<e.length;i++){const o=e[i],s=t[i];if(o[0]!==s[0]||o[1]!==s[1]||o[2]!==s[2])return!0;if(o.length!==s.length)return!0;if(4===o.length&&4===s.length&&o[3]!==s[3])return!0}return!1}class Ye{get origin(){return this._origin}constructor(e,t){this.pickerOpen=!1,this.pickerHover=null,this.wheelOpen=!1,this.savedOpen=!1,this.savedEditMode=!1,this._origin=null,this._gestureDispose=null,this._outsideClickHandler=null,this._boundEl=null,this._lastOpenedAt=0,this._scrollLockSnapshot=null,this._onModePick=e=>{e.stopPropagation();const t=e.detail?.mode??null;this._setPickerOpen(!1),t&&this._applyMode(t),this.host.requestUpdate()},this._onWheelPick=e=>{e.stopPropagation();const t=this.opts.hassProvider(),i=this.opts.entityIdProvider();if(!t||!i)return;const{r:o,g:s,b:r}=e.detail;t.callService("light","turn_on",{entity_id:i,rgb_color:[o,s,r]}),!1===this.opts.colorWheelConfigProvider?.()?.persistent&&(this.wheelOpen=!1,this.host.requestUpdate())},this._onSavedPick=e=>{e.stopPropagation();const t=this.opts.hassProvider(),i=this.opts.entityIdProvider();if(!t||!i)return;const o=e.detail;"number"==typeof o?.r&&"number"==typeof o?.g&&"number"==typeof o?.b&&(t.callService("light","turn_on",{entity_id:i,rgb_color:[o.r,o.g,o.b]}),!1===this.opts.savedColorsConfigProvider?.()?.persistent&&(this.savedOpen=!1,this.host.requestUpdate()))},this.closeWheel=()=>{this.wheelOpen=!1,this.host.requestUpdate()},this.closeSaved=()=>{this.savedOpen=!1,this.host.requestUpdate()},this.closePicker=()=>{this._setPickerOpen(!1),this.pickerHover=null,this.host.requestUpdate()},this.openWheel=()=>{this.wheelOpen=!0,this._lastOpenedAt=Date.now(),this.host.requestUpdate()},this.openSaved=()=>{this.savedOpen=!0,this._lastOpenedAt=Date.now(),this.host.requestUpdate()},this._onSavedEnterEdit=e=>{e.stopPropagation(),this.savedEditMode=!0,this.host.requestUpdate()},this._onSavedAddCurrent=e=>{e.stopPropagation(),this.opts.onSavedAddCurrent&&this.opts.onSavedAddCurrent(),this.savedEditMode=!1,this.host.requestUpdate()},this._onSavedRemove=e=>{e.stopPropagation();const t=e.detail?.index;"number"==typeof t&&(this.opts.onSavedRemove&&this.opts.onSavedRemove(t),this.host.requestUpdate())},this.host=e,this.opts=t,e.addController(this)}_setPickerOpen(e){const t=this.pickerOpen;this.pickerOpen=e,e&&!t?this._acquireScrollLock():!e&&t&&this._releaseScrollLock()}_acquireScrollLock(){if(null!==this._scrollLockSnapshot)return;const e=document.documentElement;this._scrollLockSnapshot=e.style.touchAction,e.style.touchAction="none"}_releaseScrollLock(){null!==this._scrollLockSnapshot&&(document.documentElement.style.touchAction=this._scrollLockSnapshot,this._scrollLockSnapshot=null)}hostConnected(){this._outsideClickHandler=e=>{if(!this.pickerOpen&&!this.wheelOpen&&!this.savedOpen)return;if(Date.now()-this._lastOpenedAt<300)return;const t=e.composedPath().some(e=>e?.classList?.contains?.("everyday-picker-host"));t||(this._setPickerOpen(!1),this.pickerHover=null,this.wheelOpen=!1,this.savedOpen=!1,this.host.requestUpdate())},document.addEventListener("click",this._outsideClickHandler,!0)}hostDisconnected(){this._outsideClickHandler&&(document.removeEventListener("click",this._outsideClickHandler,!0),this._outsideClickHandler=null),this._gestureDispose?.(),this._gestureDispose=null,this._releaseScrollLock(),this._boundEl=null}bindIcon(e){if(e===this._boundEl)return;if(this._gestureDispose?.(),this._gestureDispose=null,this._boundEl=e,!e)return;e.style.cursor="pointer";const t=e.querySelector(".ic")??e,i=()=>{const e=t.getBoundingClientRect();this._origin={x:e.left+e.width/2,y:e.top+e.height/2}},o=this.opts.onTap,s=null===o?void 0:o??(()=>{const e=this.opts.hassProvider(),t=this.opts.entityIdProvider();e&&t&&e.callService("light","toggle",{entity_id:t})}),r=this.opts.onDoubleTap,a=r?()=>{i(),r()}:void 0;this._gestureDispose=Ae(e,{longPressMs:this.opts.longPressMs??200,doubleTapMs:500,onTap:s,onDoubleTap:a,onPointerDownLock:()=>this._acquireScrollLock(),onPointerDownRelease:()=>{this.pickerOpen||this._releaseScrollLock()},onLongPress:()=>{i(),this.pickerHover=null,this._setPickerOpen(!0),this._lastOpenedAt=Date.now(),this.opts.onPickerOpen?.(),this.host.requestUpdate()},onLongPressMove:e=>{if(!this._origin||!this.pickerOpen)return;const t=this.opts.entityIdProvider()&&this.opts.hassProvider()?this.opts.hassProvider().states[this.opts.entityIdProvider()]:void 0,i=t?.attributes?.effect_list,o=Array.isArray(i)&&i.length>0&&!0===this.opts.effectsInPickerProvider?.();this.pickerHover=function(e,t,i="member",o={}){const s=Math.sqrt(e*e+t*t);if(s<18)return null;if(s>160)return null;let r=180*Math.atan2(t,e)/Math.PI;if(r<0&&(r+=360),"group-expanded"===i&&o.omitTemp)return e>0?"wheel":"saved";const a=ke(i,o);let n=null,l=1/0;for(const[e,t]of Object.entries(a)){let i=Math.abs(t-r);i>180&&(i=360-i),i<l&&(l=i,n=e)}return n}(e.clientX-this._origin.x,e.clientY-this._origin.y,this.opts.variant,{hasEffects:o,useMindmap:this.opts.useMindmapProvider?.()??!1,additionalMindmap:this.opts.additionalMindmapProvider?.()??!1,hasCollapse:this.opts.hasCollapseProvider?.()??!1}),this.host.requestUpdate()},onLongPressEnd:()=>{const e=this.pickerHover;this.pickerHover=null,e&&(this._setPickerOpen(!1),this._applyMode(e)),this.host.requestUpdate()}})}_applyMode(e){if(this.opts.onModePicked)this.opts.onModePicked(e,this._origin);else{if(this._origin){const t=this.opts.entityIdProvider()&&this.opts.hassProvider()?this.opts.hassProvider().states[this.opts.entityIdProvider()]:void 0,i=t?.attributes?.effect_list,o=Array.isArray(i)&&i.length>0&&!0===this.opts.effectsInPickerProvider?.();this._origin=$e(e,this._origin,this.opts.variant,{hasEffects:o,useMindmap:this.opts.useMindmapProvider?.()??!1,additionalMindmap:this.opts.additionalMindmapProvider?.()??!1,hasCollapse:this.opts.hasCollapseProvider?.()??!1})}"wheel"===e?(this.wheelOpen=!0,this._lastOpenedAt=Date.now()):"saved"===e?(this.savedOpen=!0,this._lastOpenedAt=Date.now(),this.savedEditMode=!1):"effects"===e?this.opts.onEffectsPick&&(this.opts.onEffectsPick(),this._lastOpenedAt=Date.now()):"mindmap"===e&&this.opts.onParallelMindmapPick&&(this.opts.onParallelMindmapPick(),this._lastOpenedAt=Date.now())}}renderPicker(){if(!this.pickerOpen)return null;const e=this.opts.hassProvider(),t=this.opts.entityIdProvider(),i=e&&t?e.states[t]:void 0,o=i?.attributes?.color_mode,s=i?.attributes?.effect_list,r=Array.isArray(s)&&s.length>0&&!0===this.opts.effectsInPickerProvider?.(),a=this.opts.currentSliderModeProvider?.()??"brightness";return G`
      <everyday-mode-picker
        class="everyday-picker-host"
        .variant=${this.opts.variant}
        .selected=${this.pickerHover??void 0}
        .currentMode=${a}
        .colorMode=${o}
        .hasEffects=${r}
        .useMindmap=${!0===this.opts.useMindmapProvider?.()}
        .additionalMindmap=${!0===this.opts.additionalMindmapProvider?.()}
        .hasCollapse=${!0===this.opts.hasCollapseProvider?.()}
        .parallelExpanded=${!0===this.opts.parallelExpandedProvider?.()}
        @mode-pick=${this._onModePick}
        @click=${e=>e.stopPropagation()}
      ></everyday-mode-picker>
    `}renderWheel(){if(!this.wheelOpen)return null;const e=this.opts.colorWheelConfigProvider?.(),t=this._origin,i=t?`left: ${t.x}px; top: ${t.y}px;`:"";return G`
      <div
        class="everyday-picker-host inplace-popup wheel"
        style=${i}
        @click=${e=>e.stopPropagation()}
      >
        <everyday-color-wheel
          .type=${"smooth"===e?.type?"smooth":"stepped"}
          .hueSegments=${e?.hue_segments??21}
          .saturationRings=${e?.saturation_rings??6}
          @color-pick=${this._onWheelPick}
          @click=${e=>e.stopPropagation()}
        ></everyday-color-wheel>
      </div>
    `}renderSaved(){if(!this.savedOpen)return null;const e=this._origin,t=e?`left: ${e.x}px; top: ${e.y}px;`:"",i=this.opts.savedColorsProvider?.()??[];return G`
      <div
        class="everyday-picker-host inplace-popup saved"
        style=${t}
        @click=${e=>e.stopPropagation()}
      >
        <everyday-saved-colors-picker
          .colors=${i}
          .editMode=${this.savedEditMode}
          @color-pick=${this._onSavedPick}
          @enter-edit=${this._onSavedEnterEdit}
          @add-current=${this._onSavedAddCurrent}
          @remove-color=${this._onSavedRemove}
          @click=${e=>e.stopPropagation()}
        ></everyday-saved-colors-picker>
      </div>
    `}}var Fe;const Ke=[[248,141,42],[255,250,234],[200,220,255],[255,90,90],[255,220,90],[120,220,130],[120,180,250],[200,100,220]];let Xe=Fe=class extends ce{constructor(){super(...arguments),this.groupEntityId="",this.memberIds=[],this.memberConfigs=new Map,this.longPressMs=200,this.wheelType="stepped",this.wheelHues=21,this.wheelRings=6,this.memberTap="toggle",this.compact=!1,this._compactExpanded=!1,this.expansionSticky=!1,this._childVisibleLeafCounts=new Map,this._expandedGroupPicker=new Ye(this,{variant:"group-expanded",longPressMs:200,hassProvider:()=>this.hass,entityIdProvider:()=>this.groupEntityId,currentSliderModeProvider:()=>{const e=this._memberModes[this.groupEntityId];return"temperature"===e||"hue"===e||"saturation"===e?e:"brightness"},onTap:()=>this._onGroupTap(new Event("synthetic-tap")),onDoubleTap:()=>{const e=this.groupDoubleTapAction;e&&this._runDoubleTapAction(this.groupEntityId,e,"group-expanded",this._expandedGroupPicker.origin)},onModePicked:(e,t)=>{this._applyPickerMode(this.groupEntityId,e,t,"group-expanded")},onPickerOpen:()=>this._closePickersExcept(this._expandedGroupPicker),effectsInPickerProvider:()=>this.effectsInPicker,hasCollapseProvider:()=>this.expansionSticky&&(this.compact&&this._compactExpanded||!this.compact)}),this._compactGroupPicker=new Ye(this,{variant:"group-compact",longPressMs:200,hassProvider:()=>this.hass,entityIdProvider:()=>this.groupEntityId,currentSliderModeProvider:()=>{const e=this._memberModes[this.groupEntityId];return"temperature"===e||"hue"===e||"saturation"===e?e:"brightness"},onTap:()=>this._onGroupTap(new Event("synthetic-tap")),onDoubleTap:()=>{const e=this.groupDoubleTapAction;e?this._runDoubleTapAction(this.groupEntityId,e,"group-compact",this._compactGroupPicker.origin):this._setMemberMode(this.groupEntityId,this._cycleNextMode(this.groupEntityId))},onModePicked:(e,t)=>{this._applyPickerMode(this.groupEntityId,e,t,"group-compact")},onPickerOpen:()=>this._closePickersExcept(this._compactGroupPicker),useMindmapProvider:()=>this.embedded,additionalMindmapProvider:()=>this.compact&&!this.embedded,effectsInPickerProvider:()=>this.effectsInPicker}),this._memberPickers=new Map,this.wheelPersistent=!0,this.savedPersistent=!0,this.effectsEditable=!1,this.effectsInPicker=!1,this.persistentSliderMode=!1,this.iconPosition="bottom",this.mindmapDots=!1,this._lastStates={},this._lastColorModes={},this._memberLastTemp={},this._memberModes={},this._wheelTarget=null,this._toast=null,this._savedColorsTarget=null,this._savedColors=Ke.slice(),this._savedColorsEditing=!1,this._effectsTarget=null,this._effectsEditMode=!1,this._effectsPopupActiveOrder=[],this._topologyPopupOpen=!1,this._parallelSlidersTarget=null,this._topologyAnchorRect=null,this._parallelAnchorRect=null,this._parallelPopupOrigin=null,this.fullLengthSliders=!1,this.expansionMode="inline",this.expandInPlace=!1,this.embedded=!1,this.depth=0,this.hideParent=!1,this.showIcons=!0,this.showMindmap=!0,this._popupOrigin=null,this._popupOpenedAt=0,this._lastBoundMemberIds="",this._toastTimer=null,this._popupPortal=null,this._memberColHeights=new Map,this._observedMemberCols=new Set,this._childSliderNeeds=new Map,this._observedMemberColsEl=null,this._gapRecomputeRaf=0,this._measuredMemberIconYs=new Map,this._onNestedLayoutChange=e=>{this.memberConfigs&&0!==this.memberConfigs.size&&(this._measureNestedIconYs(),queueMicrotask(()=>this._measureNestedIconYs()),requestAnimationFrame(()=>this._measureNestedIconYs()))},this._onChildSliderNeed=e=>{const t=e.detail;if(!t||!t.entity||"number"!=typeof t.width)return;if(t.entity===this.groupEntityId)return;const i=this._childSliderNeeds.get(t.entity);if(void 0!==i&&Math.abs(i-t.width)<.5)return;let o;this._childSliderNeeds.set(t.entity,t.width);for(const e of this._childSliderNeeds.values())e<60&&(void 0===o||e<o)&&(o=e);o!==this._childMinSliderNeed&&(this._childMinSliderNeed=o,this.requestUpdate())},this._onGroupTap=e=>{if(e.stopPropagation(),this.hass)return this._wheelTarget||this._savedColorsTarget||this._effectsTarget?(this._wheelTarget=null,this._savedColorsTarget=null,this._savedColorsEditing=!1,this._effectsTarget=null,this._effectsEditMode=!1,void(this._effectsPopupActiveOrder=[])):void async function(e,t,i){const o=e.states[t];if(!o)return;const s=function(e){return`everyday_group_${e.replace(/\./g,"_")}`}(t),r=`scene.${s}`;if("on"===o.state){try{await e.callService("scene","create",{scene_id:s,snapshot_entities:i})}catch{}return void await e.callService("light","turn_off",{entity_id:t})}if(e.states[r])try{return void await e.callService("scene","turn_on",{entity_id:r})}catch{}await e.callService("light","turn_on",{entity_id:t})}(this.hass,this.groupEntityId,this.memberIds)},this._userDataHydrated=!1,this._onSavedColorPick=e=>{e.stopPropagation();const t=this._savedColorsTarget;if(!t||!this.hass)return;const{r:i,g:o,b:s,k:r}=e.detail;"number"==typeof r&&r>0?(this.hass.callService("light","turn_on",{entity_id:t,color_temp_kelvin:r}),"temperature"!==this._memberModes[t]&&(this._memberModes={...this._memberModes,[t]:"temperature"})):(this.hass.callService("light","turn_on",{entity_id:t,rgb_color:[i,o,s]}),"temperature"===this._memberModes[t]&&(this._memberModes={...this._memberModes,[t]:"brightness"})),this.savedPersistent||(this._savedColorsTarget=null)},this._onSavedEnterEdit=e=>{e.stopPropagation(),this._savedColorsEditing=!0},this._onSavedRemove=e=>{e.stopPropagation();const t=e.detail.index;t<0||t>=this._savedColors.length||(this._savedColors=[...this._savedColors.slice(0,t),...this._savedColors.slice(t+1)],this._persistSavedColorsToSource())},this._onSavedAddCurrent=e=>{e.stopPropagation();const t=this._savedColorsTarget;if(!t)return;const i=this.hass?.states[t],o=i?.attributes?.rgb_color;if(!o||3!==o.length)return void this._showToast("No active rgb to save (light may be off)");const s=i?.attributes?.color_mode,r=i?.attributes?.color_temp_kelvin,a="hs"===s||"rgb"===s||"rgbw"===s||"rgbww"===s||"xy"===s,n=("temperature"===this._memberModes[t]||"color_temp"===s||!a&&"number"==typeof r&&r>0)&&"number"==typeof r&&r>0?[o[0],o[1],o[2],r]:[o[0],o[1],o[2]],l=this._savedColors.find(e=>{if(!(Math.abs(e[0]-n[0])<5&&Math.abs(e[1]-n[1])<5&&Math.abs(e[2]-n[2])<5))return!1;const t=4===n.length?n[3]:void 0,i=4===e.length?e[3]:void 0;return void 0===t&&void 0===i||void 0!==t&&void 0!==i&&Math.abs(t-i)<50});l?this._showToast("Color already saved"):(this._savedColors=[...this._savedColors,n],this._persistSavedColorsToSource(),this._savedColorsEditing=!1)},this._onEffectPick=e=>{e.stopPropagation();const t=this._effectsTarget;if(!t||!this.hass)return;const i=e.detail?.effect;i&&(this.hass.callService("light","turn_on",{entity_id:t,effect:i}),this._effectsEditMode||(this._effectsTarget=null))},this._onEffectsEnterEdit=e=>{e.stopPropagation(),this._effectsEditMode=!0},this._onEffectsExitEdit=e=>{e.stopPropagation(),this._effectsEditMode=!1},this._onEffectsDelete=e=>{e.stopPropagation();const t=this._effectsTarget;if(!t)return;const i=e.detail?.effect;if(!i)return;const o=this.hass?.states[t]?.attributes?.effect_list??[],s=this._effectsPopupActiveOrder.length>0?this._effectsPopupActiveOrder:o;this._effectsPopupActiveOrder=s.filter(e=>e!==i)},this._onEffectsRestore=e=>{e.stopPropagation();const t=this._effectsTarget;if(!t)return;const i=e.detail?.effect;if(!i)return;const o=this.hass?.states[t]?.attributes?.effect_list??[],s=this._effectsPopupActiveOrder.length>0?this._effectsPopupActiveOrder:o;s.includes(i)||(this._effectsPopupActiveOrder=[...s,i])},this._onColorPick=e=>{e.stopPropagation();const t=this._wheelTarget;if(!t||!this.hass)return;const{r:i,g:o,b:s}=e.detail;this.hass.callService("light","turn_on",{entity_id:t,rgb_color:[i,o,s]}),"temperature"===this._memberModes[t]&&(this._memberModes={...this._memberModes,[t]:"brightness"}),this.wheelPersistent||(this._wheelTarget=null)}}connectedCallback(){if(super.connectedCallback(),this._lastBoundMemberIds="",this._popupPortal||(this._popupPortal=document.createElement("div"),this._popupPortal.className="everyday-popup-portal",document.body.appendChild(this._popupPortal)),!Fe._portalStylesInjected){const e=document.createElement("style");e.id="everyday-popup-portal-styles",e.textContent=Te,document.head.appendChild(e),Fe._portalStylesInjected=!0}"undefined"!=typeof ResizeObserver&&(this._memberColRO=new ResizeObserver(e=>{let t=!1;for(const i of e){const e=i.target.getAttribute("data-entity");if(!e)continue;const o=Math.round(i.contentRect.height);this._memberColHeights.get(e)!==o&&(this._memberColHeights.set(e,o),t=!0)}t&&(this.requestUpdate(),this._scheduleGapRecompute())}),this._memberColsRO=new ResizeObserver(()=>{this._scheduleGapRecompute()})),this._restoreExpansionFromStorage(),this.addEventListener("slider-width-need",this._onChildSliderNeed),this.addEventListener("nested-layout-change",this._onNestedLayoutChange)}disconnectedCallback(){super.disconnectedCallback(),this._memberPickers.clear(),this._removeOutsideClickListener(),null!==this._toastTimer&&clearTimeout(this._toastTimer),this._popupPortal&&(le(G``,this._popupPortal),this._popupPortal.remove(),this._popupPortal=null),this._memberColRO?.disconnect(),this._memberColRO=void 0,this._memberColHeights.clear(),this._memberColsRO?.disconnect(),this._memberColsRO=void 0,this._observedMemberColsEl=null,this._gapRecomputeRaf&&(cancelAnimationFrame(this._gapRecomputeRaf),this._gapRecomputeRaf=0),this._computedMemberColsGap=void 0,this.removeEventListener("slider-width-need",this._onChildSliderNeed),this._childSliderNeeds.clear(),this._childMinSliderNeed=void 0,this.removeEventListener("nested-layout-change",this._onNestedLayoutChange),this._lastBoundMemberIds=""}_expansionStorageKey(){return this.groupEntityId?`everyday-light-card:expanded:${this.groupEntityId}`:null}_restoreExpansionFromStorage(){if(!this.expansionSticky||!this.compact)return;const e=this._expansionStorageKey();if(e)try{const t=window.localStorage.getItem(e);"1"===t?this._compactExpanded=!0:"0"===t&&(this._compactExpanded=!1)}catch{}}_persistExpansionToStorage(){if(!this.expansionSticky||!this.compact)return;const e=this._expansionStorageKey();if(e)try{window.localStorage.setItem(e,this._compactExpanded?"1":"0")}catch{}}updated(e){super.updated(e),(e.has("expansionSticky")||e.has("compact")||e.has("groupEntityId"))&&this.expansionSticky&&this.compact&&this._restoreExpansionFromStorage();(e.has("_compactExpanded")||e.has("_childVisibleLeafCounts")||e.has("memberIds")||e.has("compact"))&&this.dispatchEvent(new CustomEvent("visible-leaf-count-change",{bubbles:!0,composed:!0,detail:{count:this._currentVisibleLeafCount()}}));const t=""===this._lastBoundMemberIds&&this.memberIds.length>0;if(e.has("memberIds")||t){const e=this.memberIds.join(",");e!==this._lastBoundMemberIds&&(this._lastBoundMemberIds=e,this._rebindMemberGestures())}if(e.has("hass")&&!this.persistentSliderMode){let e=null;const t=0===Object.keys(this._lastStates).length,i=[...this.memberIds,this.groupEntityId];for(const o of i){const i=this.hass?.states[o]?.state??"unavailable",s=this._lastStates[o];if(!t&&"on"===s&&"off"===i){const t=this._memberModes[o];t&&"brightness"!==t&&(e||(e={...this._memberModes}),e[o]="brightness")}this._lastStates[o]=i;const r=this.hass?.states[o]?.attributes?.color_mode??"";"color_temp"===(this._lastColorModes[o]??"")&&""!==r&&"color_temp"!==r&&"temperature"===this._memberModes[o]&&(e||(e={...this._memberModes}),e[o]="brightness"),r&&(this._lastColorModes[o]=r)}e&&(this._memberModes=e)}if(e.has("hass")){const e=[...this.memberIds,this.groupEntityId];for(const t of e){const e=this.hass?.states[t]?.attributes?.color_temp_kelvin;"number"==typeof e&&e>0&&(this._memberLastTemp[t]=e)}}(e.has("hass")||e.has("savedColorsConfig"))&&this._syncSavedColorsFromSource(),this._bindCompactGestures(),this._bindExpandedGroupGestures(),(e.has("compact")||e.has("_compactExpanded")||e.has("memberIds")||t)&&(this._compactExpanded?this._rebindMemberGestures():!0===e.get("_compactExpanded")&&Object.keys(this._memberModes).length>0&&(this._memberModes={}),(e.has("_compactExpanded")||e.has("groupEntityId")||e.has("expansionSticky"))&&this._persistExpansionToStorage()),(e.has("_wheelTarget")||e.has("_savedColorsTarget")||e.has("_effectsTarget")||e.has("_compactExpanded")||e.has("_topologyPopupOpen")||e.has("_parallelSlidersTarget"))&&(null!==this._wheelTarget||null!==this._savedColorsTarget||null!==this._effectsTarget||this._compactExpanded||this._topologyPopupOpen||null!==this._parallelSlidersTarget?this._installOutsideClickListener():this._removeOutsideClickListener()),(e.has("_wheelTarget")||e.has("_savedColorsTarget")||e.has("_effectsTarget")||e.has("_topologyPopupOpen")||e.has("_parallelSlidersTarget")||e.has("_parallelPopupOrigin")||e.has("_popupOrigin")||e.has("_savedColors")||e.has("_savedColorsEditing")||e.has("_memberModes")||e.has("hass")||e.has("wheelType")||e.has("wheelHues")||e.has("wheelRings")||e.has("memberIds"))&&this._renderPopupPortal(),this._reobserveMemberCols(),this._measureNestedIconYs()}_measureNestedIconYs(){const e=this.shadowRoot?.querySelector(".member-cols");if(!e)return;const t=e.getBoundingClientRect().top;let i=!1;const o=this.shadowRoot?.querySelectorAll(".member-col[data-entity]");if(o){for(const e of o){const o=e.getAttribute("data-entity");if(!o)continue;let s=null;if(this.memberConfigs.has(o)){const t=e.querySelector("everyday-light-card"),i=t?.shadowRoot?.querySelector("everyday-group-layout-expanded");s=i?.shadowRoot?.querySelector(".tile.group.compact-target .ic")??i?.shadowRoot?.querySelector(".topology .tile.group .ic")??t?.shadowRoot?.querySelector(".parallel-compact-icon")??t?.shadowRoot?.querySelector(".parallel-mindmap-icon")??t?.shadowRoot?.querySelector(".single-icon")??null}else s=e.querySelector(".tile.member .ic")??e.querySelector(".tile .ic");if(!s)continue;const r=s.getBoundingClientRect();if(r.height<=0)continue;const a=r.top+r.height/2-t,n=Math.round(a);this._measuredMemberIconYs.get(o)!==n&&(this._measuredMemberIconYs.set(o,n),i=!0)}for(const e of this._measuredMemberIconYs.keys())this.memberIds.includes(e)||(this._measuredMemberIconYs.delete(e),i=!0);i&&this.requestUpdate()}}_reobserveMemberCols(){if(!this._memberColRO)return;const e=this.shadowRoot?.querySelectorAll(".member-col");if(!e)return;const t=new Set(e);for(const e of this._observedMemberCols)t.has(e)||this._memberColRO.unobserve(e);for(const e of t)this._observedMemberCols.has(e)||this._memberColRO.observe(e);this._observedMemberCols=t;const i=new Set(this.memberIds);for(const e of this._memberColHeights.keys())i.has(e)||this._memberColHeights.delete(e);if(this._memberColsRO){const e=this.shadowRoot?.querySelector(".member-cols")??null;e!==this._observedMemberColsEl&&(this._observedMemberColsEl&&this._memberColsRO.unobserve(this._observedMemberColsEl),e&&(this._memberColsRO.observe(e),this._scheduleGapRecompute()),this._observedMemberColsEl=e)}}_scheduleGapRecompute(){this._gapRecomputeRaf||(this._gapRecomputeRaf=requestAnimationFrame(()=>{this._gapRecomputeRaf=0;const e=this._observedMemberColsEl,t=e?.clientWidth??0,i=e?.children.length??0,o=getComputedStyle(this).getPropertyValue("--everyday-slider-width").trim(),s=parseFloat(o)||60,r=Ne({depth:this.depth,containerWidth:t,childCount:i,baselineSliderWidth:s}),a=this._computedMemberColsGap,n=this._computedSliderWidthOverride,l=void 0===a||Math.abs(a-r.gap)>=.5,d=(n??-1)!==(r.sliderOverride??-1)&&(void 0===n||void 0===r.sliderOverride||Math.abs((n??0)-(r.sliderOverride??0))>=.5);l&&(this._computedMemberColsGap=r.gap),d&&(this._computedSliderWidthOverride=r.sliderOverride),(l||d)&&this.requestUpdate();const c=r.sliderOverride??s;this.groupEntityId&&this.dispatchEvent(new CustomEvent("slider-width-need",{detail:{entity:this.groupEntityId,width:c},bubbles:!0,composed:!0}))}))}_renderPopupPortal(){if(!this._popupPortal)return;const e=this._popupOrigin?.x??0,t=this._popupOrigin?.y??0,i=G`
      ${this._wheelTarget&&this._popupOrigin?G`
            <div
              class="inplace-popup wheel"
              style=${`left: ${e}px; top: ${t}px;`}
              @click=${e=>e.stopPropagation()}
            >
              <everyday-color-wheel
                .wheelType=${this.wheelType}
                .hues=${this.wheelHues}
                .rings=${this.wheelRings}
                @color-pick=${this._onColorPick}
              ></everyday-color-wheel>
            </div>
          `:null}
      ${this._savedColorsTarget&&this._popupOrigin?G`
            <div
              class="inplace-popup saved"
              style=${`left: ${e}px; top: ${t}px;`}
              @click=${e=>e.stopPropagation()}
            >
              <everyday-saved-colors-picker
                .colors=${this._savedColors}
                .editMode=${this._savedColorsEditing}
                @color-pick=${this._onSavedColorPick}
                @enter-edit=${this._onSavedEnterEdit}
                @remove-color=${this._onSavedRemove}
                @add-current=${this._onSavedAddCurrent}
              ></everyday-saved-colors-picker>
            </div>
          `:null}
      ${this._topologyPopupOpen?this._renderTopologyPopup():null}
      ${this._parallelSlidersTarget?this._renderParallelSlidersPopup():null}
      ${this._effectsTarget&&this._popupOrigin?(()=>{const i=this.hass?.states[this._effectsTarget]?.attributes?.effect_list??[],o=this._effectsPopupActiveOrder.length>0?this._effectsPopupActiveOrder:i;return G`
              <div
                class="inplace-popup effects"
                style=${`left: ${e}px; top: ${t}px; max-width: 320px; max-height: 60vh;`}
                @click=${e=>e.stopPropagation()}
              >
                <div
                  style="display:flex; justify-content:space-between; align-items:center; margin: 0 0 8px; padding: 0 4px;"
                >
                  <span
                    style="font-size: 13px; font-weight: 500; color: var(--primary-text-color, #fff); opacity: 0.9;"
                    >Effects${this._effectsEditMode?" · edit":""}</span
                  >
                  ${this._effectsEditMode?G`<button
                        type="button"
                        style="border: none; background: transparent; color: var(--primary-color, #03a9f4); font-size: 12px; cursor: pointer; padding: 2px 6px;"
                        @click=${this._onEffectsExitEdit}
                      >
                        Done
                      </button>`:null}
                </div>
                <everyday-effects-list-picker
                  .effects=${i}
                  .activeOrder=${o}
                  .editMode=${this._effectsEditMode}
                  .editable=${this.effectsEditable}
                  .longPressMs=${this.longPressMs}
                  @effect-pick=${this._onEffectPick}
                  @enter-edit=${this._onEffectsEnterEdit}
                  @delete-effect=${this._onEffectsDelete}
                  @restore-effect=${this._onEffectsRestore}
                  @exit-edit=${this._onEffectsExitEdit}
                ></everyday-effects-list-picker>
              </div>
            `})():null}
    `;le(i,this._popupPortal),this._topologyPopupOpen?this._bindPortalTopologyGestures():this._teardownPortalGestures()}_bindPortalTopologyGestures(){if(!this._popupPortal)return;this._popupPortal.querySelectorAll(".topology-popup .tile.member[data-entity]:not([data-portal-bound])").forEach(e=>{const t=e.dataset.entity;t&&(e.dataset.portalBound="1",this._memberPickers.get(t)?.bindIcon(e))})}_teardownPortalGestures(){if(this._popupPortal){this._popupPortal.querySelectorAll("[data-portal-bound]").forEach(e=>e.removeAttribute("data-portal-bound"))}this._rebindMemberGestures()}_renderTopologyPopup(){if(!this.hass||!this.groupEntityId||0===this.memberIds.length)return G``;if(!this._topologyAnchorRect)return G``;const e=this._topologyAnchorRect,t=["position: absolute",`left: ${e.left+window.scrollX}px`,`top: ${e.bottom+window.scrollY}px`,`width: ${e.width}px`,`min-height: ${e.height}px`,"transform: translateY(-100%)"].join("; "),i=this.fullLengthSliders?"--everyday-slider-height: 270px;":"";return G`
      <div
        class="topology-popup anchored"
        style=${t}
        @click=${e=>e.stopPropagation()}
      >
        <div class="popup-card topology-popup-card anchored-card" style=${i}>
          ${this._renderTopologyTree()}
        </div>
      </div>
    `}_entityIcon(e,t,i){return function(e,t,i,o){const s=e?.states[t]?.attributes?.icon;return s??o??i}(this.hass,e,t,i)}_renderTopologyTree(){const e=this.memberIds.length,t=this._isGroupOn(),i=this._groupIcon("mdi:ceiling-light"),o=this.compact&&this._compactExpanded,s=this.sliderHeight??(this.expandInPlace&&o?Math.max(80,150):270),r=(s??170)-170,a="top"===this.iconPosition,n=a?30:282+r,l=a?92+r:195+r,d=Math.max(0,Math.min(De.length-1,Math.floor(this.depth))),c=this._computedMemberColsGap??De[d],h=this.memberConfigs.size>0,p=this.embedded||h,u=this.sliderWidth??(this.embedded?void 0:60),m=this.memberIds.map(e=>this._memberLeafWeight(e)),g=this.memberConfigs.size>0&&m.some(e=>e>1),f=g?m.map(e=>`${e}fr`).join(" "):`repeat(${e}, 1fr)`,v=[];void 0!==this._computedSliderWidthOverride&&v.push(this._computedSliderWidthOverride),void 0!==this._childMinSliderNeed&&v.push(this._childMinSliderNeed);const y=(v.length>0?Math.min(...v):void 0)??u,b=[`--member-count: ${e}`,void 0!==y?`--everyday-slider-width: ${y}px`:"",s?`--everyday-slider-height: ${s}px`:"",`--member-cols-template: ${f}`,`--member-cols-gap: ${c}px`].filter(Boolean).join("; "),_=this._expandedGroupPicker.pickerOpen,x=this.hass?.states[this.groupEntityId],w="on"===x?.state,k=x?.attributes.rgb_color,$=x?.attributes.brightness,P=Ie(this.iconColor,w,k,$),S=G`
      <div class="group-row">
        <div
          class="tile group ${t?"on":"off"} ${_?"lp":""}"
          role="button"
          tabindex="0"
          @click=${e=>{e.stopPropagation(),e.preventDefault()}}
          @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._onGroupTap(e))}}
        >
          <div class="ic">
            <!-- Stefan-2026-05-10 R158: ha-state-icon auto-resolves the
                 entity-registry icon (user-set via HA Customize) which
                 ha-icon misses (it only reads state.attributes.icon).
                 stateObj passes the live state for the entity, icon
                 stays as a fallback when no entity-registry icon is set.
                 Stefan-2026-05-11 P15.6-r63f (R305): inline color via
                 the shared icon_color config when set. -->
            <ha-state-icon
              class="compact-glyph"
              style=${P}
              .hass=${this.hass}
              .stateObj=${this.hass?.states[this.groupEntityId]}
              .icon=${i}
            ></ha-state-icon>
          </div>
          <div class="lbl">${this._groupName()}</div>
          ${_?G`<div class="picker-overlay">${this._expandedGroupPicker.renderPicker()}</div>`:null}
        </div>
      </div>
    `,M=G`
      <div class="member-cols">
        ${this.memberIds.map(e=>{const t=this.memberConfigs.get(e);if(t){const i={type:"custom:everyday-light-card",entity:e,icon_color:this.iconColor,...t,embedded:!0};return G`
              <div class="member-col nested" data-entity=${e}>
                <everyday-light-card
                  .hass=${this.hass}
                  .config=${i}
                  .embedded=${!0}
                  .depth=${this.depth+1}
                  @visible-leaf-count-change=${t=>this._onChildVisibleLeafCountChange(e,t)}
                ></everyday-light-card>
              </div>
            `}const i=this._memberPickers.get(e),o=i?.pickerOpen??!1,s=this._entityIcon(e,"mdi:lightbulb",this.memberIconName),r=this.hass?.states[e],a=this._isMemberOn(e),n=r?.attributes.rgb_color,l=r?.attributes.brightness,d=Ie(this.iconColor,a,n,l);return G`
            <div class="member-col" data-entity=${e}>
              <everyday-vertical-pill-slider
                .hass=${this.hass}
                .entity=${e}
                .mode=${this._modeFor(e)}
              ></everyday-vertical-pill-slider>
              <div
                class="tile member ${this._isMemberOn(e)?"on":"off"} ${o?"lp":""}"
                data-entity=${e}
              >
                <div class="ic">
                  <!-- Stefan-2026-05-10 R158: ha-state-icon for proper
                       entity-registry icon resolution.
                       Stefan-2026-05-11 P15.6-r63f (R305): inline color
                       per the host icon_color cascade. -->
                  <ha-state-icon
                    style=${d}
                    .hass=${this.hass}
                    .stateObj=${this.hass?.states[e]}
                    .icon=${s}
                  ></ha-state-icon>
                </div>
                <div class="lbl">${this._memberLabel(e)}</div>
                ${o?G`<div class="picker-overlay">${i?.renderPicker()}</div>`:null}
              </div>
            </div>
          `})}
      </div>
    `,C=this.memberIds.map(e=>this.memberConfigs.has(e)?23:17),E=p&&(this._measuredMemberIconYs.size>0||this._memberColHeights.size>0)?this.memberIds.map(e=>{const t=this.memberConfigs.has(e),i=this._measuredMemberIconYs.get(e);if("number"==typeof i&&i>0)return i;const o=this._memberColHeights.get(e);if(void 0===o||o<=0)return;const s=t?41:35;return Math.max(0,o-s)}):void 0,A=E&&E.every(e=>"number"==typeof e)?E:void 0,R=this.showMindmap?G`
          <everyday-mindmap-path
            class="topology-bg"
            aria-hidden="true"
            .members=${this._toMindmapMembers()}
            icon-position=${this.iconPosition}
            .memberYOverride=${p?void 0:l}
            .groupYOverride=${p?void 0:n}
            .tileGap=${c}
            .dotsEnabled=${this.mindmapDots}
            .groupDotEnabled=${!0}
            .groupOn=${t}
            .groupRgb=${this.hass?.states[this.groupEntityId]?.attributes?.rgb_color}
            .memberRadii=${C}
            .colWeights=${g?m:void 0}
            .memberYs=${A}
            group-icon-offset="46"
          ></everyday-mindmap-path>
        `:null,O=this.hideParent?null:S,T="topology"+(this.showIcons?"":" hide-icons");return G`
      <div class="layout" style=${b}>
        <div class=${T}>
          ${R}
          ${null===O?M:a?G`${O}${M}`:G`${M}${O}`}
        </div>
      </div>
    `}_renderParallelSlidersPopup(){const e=this._parallelSlidersTarget,t=this._parallelAnchorRect,i=this._parallelPopupOrigin;if(!e||!i&&!t)return G``;const o=!0===this.parallelSlidersConfig?.show_labels,s=(this.fullLengthSliders,270),r="compact"===this.parallelSlidersConfig?.layout?["brightness"]:e.modes,a=Math.max(160,82*r.length+20),n=i?["position: absolute",`left: ${i.x+window.scrollX-a/2}px`,`top: ${i.y+window.scrollY}px`,`width: ${a}px`,"transform: translateY(-100%)"].join("; "):["position: absolute",`left: ${t.left+window.scrollX+t.width/2-a/2}px`,`top: ${t.bottom+window.scrollY}px`,`width: ${a}px`,`min-height: ${t.height}px`,"transform: translateY(-100%)"].join("; ");return G`
      <div
        class="parallel-popup anchored"
        style=${n}
        @click=${e=>e.stopPropagation()}
      >
        <div class="popup-card anchored-card parallel-card">
          <div class="popup-body parallel-body">
            ${r.map(t=>G`
                <div class="parallel-col">
                  ${o?G`<span class="parallel-lbl">${t}</span>`:null}
                  <everyday-vertical-pill-slider
                    class="popup-slider"
                    style=${`--everyday-slider-height: ${s}px`}
                    .hass=${this.hass}
                    .entity=${e.entityId}
                    .mode=${t}
                  ></everyday-vertical-pill-slider>
                </div>
              `)}
          </div>
        </div>
      </div>
    `}_groupName(){return this.groupName??function(e,t){const i=e?.states[t];return i?.attributes?.friendly_name??t}(this.hass,this.groupEntityId)}_groupIcon(e){return this.groupIconName??this.hass?.states[this.groupEntityId]?.attributes?.icon??e}_memberLabel(e){return function(e,t){const i=e?.states[t],o=i?.attributes?.friendly_name;return o||(t.split(".").slice(1).join(".")||t).replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}(this.hass,e)}_toMindmapMembers(){return e=this.hass,this.memberIds.map(t=>{const i=e?.states[t];return i?{state:i.state,rgb:i.attributes.rgb_color,brightness:i.attributes.brightness}:{state:"unavailable"}});var e}_isMemberOn(e){return je(this.hass,e)}_isGroupOn(){return je(this.hass,this.groupEntityId)}_closePickersExcept(e){this._expandedGroupPicker!==e&&this._expandedGroupPicker.closePicker(),this._compactGroupPicker!==e&&this._compactGroupPicker.closePicker();for(const t of this._memberPickers.values())t!==e&&t.closePicker()}_rebindMemberGestures(){const e=new Set(this.memberIds);for(const[t,i]of this._memberPickers)e.has(t)||(this.removeController(i),this._memberPickers.delete(t));for(const e of this.memberIds)this._memberPickers.has(e)||this._memberPickers.set(e,this._createMemberPicker(e));this._memberTileEls&&this._memberTileEls.forEach(e=>{const t=e.dataset.entity;t&&this._memberPickers.get(t)?.bindIcon(e)})}_createMemberPicker(e){return new Ye(this,{variant:"member",longPressMs:this.longPressMs,hassProvider:()=>this.hass,entityIdProvider:()=>e,currentSliderModeProvider:()=>{const t=this._memberModes[e];return"temperature"===t||"hue"===t||"saturation"===t?t:"brightness"},onTap:()=>{"none"!==this.memberTap&&("classic_more_info"!==this.memberTap?this.hass&&this.hass.callService("light","toggle",{entity_id:e}):this._showToast("classic-mode more-info arrives in Phase 9"))},onDoubleTap:()=>{const t=this.memberConfigs.get(e),i=t?.gestures?.member_icon?.double_tap;if(i){const t=this._memberPickers.get(e);return void this._runDoubleTapAction(e,i,"member",t?.origin??null)}const o=this._cycleNextMode(e);this._setMemberMode(e,o)},onModePicked:(t,i)=>{this._applyPickerMode(e,t,i,"member")},onPickerOpen:()=>{const t=this._memberPickers.get(e);t&&this._closePickersExcept(t)},effectsInPickerProvider:()=>this.effectsInPicker})}_runDoubleTapAction(e,t,i,o=null){this.hass&&e&&"none"!==t&&("toggle"!==t?"toggle_with_restore"!==t?"color_wheel"!==t?"saved_colors"!==t?"expand_inline"!==t?"expand_inline_parallel"!==t?"cycle_mode"!==t?"effects_list"!==t?"classic_more_info"!==t?"mode_picker"!==t||this._applyPickerMode(e,"wheel",o,i):this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:e}})):this._applyPickerMode(e,"effects",o,i):this._setMemberMode(e,this._cycleNextMode(e)):this._applyPickerMode(e,"parallel",null,"member"):this.compact&&(this._compactExpanded=!0):this._applyPickerMode(e,"saved",o,i):this._applyPickerMode(e,"wheel",o,i):e===this.groupEntityId?this._onGroupTap(new Event("synthetic-double-tap")):this.hass.callService("light","toggle",{entity_id:e}):this.hass.callService("light","toggle",{entity_id:e}))}_applyPickerMode(e,t,i,o="member"){const s=this.hass?.states[e],r=s?.attributes?.effect_list,a=Array.isArray(r)&&r.length>0,n="group-compact"===o&&this.compact&&!this.embedded,l=i?$e(t,i,o,{hasEffects:a,additionalMindmap:n}):i;if("temp"===t){const t="temperature"===this._memberModes[e]?"brightness":"temperature";return void this._setMemberMode(e,t)}if("cycle"===t){const t=this._cycleNextMode(e);return void this._setMemberMode(e,t)}if("effects"===t)return this._effectsTarget=e,l&&(this._popupOrigin=l),void(this._popupOpenedAt=Date.now());if("mindmap"!==t)if("collapse"!==t){if("parallel"===t){const t=this.parallelSlidersConfig?.modes??["brightness","temperature","hue","saturation"];if(!("member"===o||!l)&&l)this._parallelPopupOrigin=l,this._parallelAnchorRect=null;else{const t=`.tile.member[data-entity="${CSS.escape(e)}"]`,i=this.renderRoot.querySelector(t)??this._popupPortal?.querySelector(t),o=i?.parentElement,s=o?.querySelector("everyday-vertical-pill-slider");this._parallelAnchorRect=s?s.getBoundingClientRect():this.getBoundingClientRect(),this._parallelPopupOrigin=null}return this._parallelSlidersTarget={entityId:e,modes:t},void(this._popupOpenedAt=Date.now())}if("wheel"===t)return this._wheelTarget=e,l&&(this._popupOrigin=l),void(this._popupOpenedAt=Date.now());this._savedColorsTarget=e,this._savedColorsEditing=!1,l&&(this._popupOrigin=l),this._popupOpenedAt=Date.now()}else"group-expanded"===o&&this.compact&&(this._compactExpanded=!1);else"group-compact"===o&&("popup"===this.expansionMode?(this._topologyAnchorRect=this.getBoundingClientRect(),this._topologyPopupOpen=!0,this._popupOpenedAt=Date.now()):this._compactExpanded=!0)}_syncSavedColorsFromSource(){const e=Be(this.hass,this.savedColorsConfig,this._savedColors);e&&(this._savedColors=e),this.savedColorsConfig?.source||this._userDataHydrated||!this.groupEntityId||(this._userDataHydrated=!0,Ge(this.hass,this.groupEntityId).then(e=>{e&&e.length>0&&(this._savedColors=e)}))}_persistSavedColorsToSource(){const e=We(this.hass,this.savedColorsConfig,this._savedColors);if(e&&"overflow"in e){const{helperId:t,length:i,max:o}=e.overflow;this._showToast(`Saved-colors list (${i} chars) exceeds ${t} max (${o}). Increase the helper's max.`)}!this.savedColorsConfig?.source&&this.groupEntityId&&qe(this.hass,this.groupEntityId,this._savedColors)}_installOutsideClickListener(){this._outsideClickListener||(this._outsideClickListener=e=>{const t=e.composedPath();t.some(e=>e?.classList?.contains?.("picker-overlay"));const i=t.some(e=>e?.classList?.contains?.("inplace-popup")),o=t.some(e=>e?.classList?.contains?.("topology-popup")),s=t.some(e=>e?.classList?.contains?.("parallel-popup")),r=Date.now()-this._popupOpenedAt<250;if(this._topologyPopupOpen)return void(o||i||s||r||(this._topologyPopupOpen=!1,this._topologyAnchorRect=null));if(this._parallelSlidersTarget)return void(s||i||r||(this._parallelSlidersTarget=null,this._parallelAnchorRect=null,this._parallelPopupOrigin=null));if(null!==this._wheelTarget||null!==this._savedColorsTarget||null!==this._effectsTarget)i||r||(this._wheelTarget&&(this._wheelTarget=null),this._savedColorsTarget&&(this._savedColorsTarget=null,this._savedColorsEditing=!1),this._effectsTarget&&(this._effectsTarget=null,this._effectsEditMode=!1,this._effectsPopupActiveOrder=[]));else if(!this.expansionSticky&&this._compactExpanded&&!r){if(!!document.querySelector(".inplace-popup, .parallel-popup, .topology-popup")){const e=t.some(e=>{const t=e;return"string"==typeof t?.tagName&&"HA-CARD"===t.tagName});if(e)return}const e=t.some(e=>{const t=e;if(!t)return!1;const i=t.classList;if(i?.contains?.("tile"))return!0;if(i?.contains?.("picker-overlay"))return!0;if(i?.contains?.("inplace-popup"))return!0;return"everyday-vertical-pill-slider"===("string"==typeof t.tagName?t.tagName.toLowerCase():"")});e||(this._compactExpanded=!1)}},document.addEventListener("click",this._outsideClickListener,!0))}_removeOutsideClickListener(){this._outsideClickListener&&(document.removeEventListener("click",this._outsideClickListener,!0),this._outsideClickListener=void 0)}_showToast(e){this._toast=e,null!==this._toastTimer&&clearTimeout(this._toastTimer),this._toastTimer=window.setTimeout(()=>{this._toast=null,this._toastTimer=null},2400)}_modeFor(e){return this._memberModes[e]??"brightness"}_setMemberMode(e,t){if(this._memberModes={...this._memberModes,[e]:t},"temperature"===t&&this._isMemberOn(e)&&this.hass){const t=this._memberLastTemp[e]??3500;this.hass.callService("light","turn_on",{entity_id:e,color_temp_kelvin:t})}}_currentVisibleLeafCount(){if(this.compact&&!this._compactExpanded)return 1;if(!this.memberIds||0===this.memberIds.length)return 1;let e=0;for(const t of this.memberIds)e+=this._memberLeafWeight(t);return Math.max(1,e)}_onChildVisibleLeafCountChange(e,t){t.stopPropagation();const i=t.detail,o=i?.count;if("number"!=typeof o||!Number.isFinite(o)||o<1)return;if(this._childVisibleLeafCounts.get(e)===o)return;const s=new Map(this._childVisibleLeafCounts);s.set(e,o),this._childVisibleLeafCounts=s}_memberLeafWeight(e){const t=this._childVisibleLeafCounts.get(e);if("number"==typeof t)return t;const i=this.memberConfigs.get(e);return this._countLeavesForEntity(e,i?.group?.manual_members,0,i?.group?.layout)}_countLeavesForEntity(e,t,i,o){if(i>10)return 1;if("compact"===o)return 1;if(t&&t.length>0){let e=0;for(const o of t)"string"==typeof o?e+=this._countLeavesForEntity(o,void 0,i+1):o.entity&&(e+=this._countLeavesForEntity(o.entity,o.group?.manual_members,i+1,o.group?.layout));return e}const s=this.hass?.states[e]?.attributes?.entity_id;if(Array.isArray(s)&&s.length>0){let e=0;for(const t of s)e+=this._countLeavesForEntity(t,void 0,i+1);return e}return 1}_cycleNextMode(e){const t=this.hass?.states[e],i=t?.attributes?.color_mode,o=this._memberModes[e]??"brightness";if(this.cycleModes&&this.cycleModes.length>0){const e=this.cycleModes.indexOf(o),t=e<0?0:(e+1)%this.cycleModes.length;return this.cycleModes[t]}if("color_temp"===i)return"brightness"===o?"temperature":"brightness";switch(o){case"brightness":return"hue";case"hue":return"saturation";default:return"brightness"}}_renderCompact(){const e=this._isGroupOn(),t=this.groupEntityId,i=this._compactGroupPicker.pickerOpen,o=this._groupIcon("mdi:ceiling-light"),s=this.hass?.states[t],r=s?.attributes.rgb_color,a=s?.attributes.brightness,n=Ie(this.iconColor,e,r,a);let l="var(--mindmap-group-stroke, #f4b91d)";e?r&&3===r.length&&(l=`rgba(${r[0]}, ${r[1]}, ${r[2]}, 1)`):l="var(--disabled-color, rgba(150, 150, 150, 0.55))";const d=`border-color: ${l};`,c=this._memberModes[t]??"brightness",h=G`
      <div class="group-row">
        <div
          class="tile group compact-target ${e?"on":"off"} ${i?"lp":""}"
          role="button"
          tabindex="0"
          @click=${e=>{e.stopPropagation(),e.preventDefault()}}
          @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._onGroupTap(e))}}
        >
          <div class="ic" style=${d}>
            <!-- Stefan-2026-05-10 R158: ha-state-icon for proper
                 entity-registry icon resolution.
                 Stefan-2026-05-11 P15.6-r63f (R305): inline color
                 from icon_color cascade — uniform with expanded view.
                 Stefan-2026-05-12 P15.6-r63i (R311): parent .ic gets
                 inline border-color so the ring tracks entity state
                 (off=gray, on+rgb=RGB, otherwise themed gold). Matches
                 the expanded-view SVG groupDot stroke (mindmap-path.ts). -->
            <ha-state-icon
              class="compact-glyph"
              style=${n}
              .hass=${this.hass}
              .stateObj=${this.hass?.states[t]}
              .icon=${o}
            ></ha-state-icon>
          </div>
          <div class="lbl">${this._groupName()}</div>
          <!-- Stefan-2026-05-12 P15.6-r63i (R310 / PA-0039): R274's
               compact-state-line removed. Stefan-Quote: "i dont understand
               why this config shows the label 'on'. it does not make any
               sense. Where does the 'on' come from? remove it". The state
               is already conveyed via icon-color (on-state cascade) — no
               need for a redundant text glyph that just says "on" / "off". -->
          ${i?G`<div class="picker-overlay">${this._compactGroupPicker.renderPicker()}</div>`:null}
        </div>
      </div>
    `,p=this._topologyPopupOpen?"popup-hidden":"",u=G`
      <div class="compact-slider ${p}">
        <everyday-vertical-pill-slider
          class="compact-slider-el"
          .hass=${this.hass}
          .entity=${t}
          .mode=${c}
        ></everyday-vertical-pill-slider>
      </div>
    `,m=this.sliderHeight?`--everyday-slider-height: ${this.sliderHeight}px`:"";return G`
      <div class="layout compact" style=${m}>
        ${"top"===this.iconPosition?G`${h}${u}`:G`${u}${h}`}
      </div>
    `}_bindCompactGestures(){if(!this.compact||this._compactExpanded)return void this._compactGroupPicker.bindIcon(null);const e=this.renderRoot.querySelector(".tile.group.compact-target");this._compactGroupPicker.bindIcon(e)}_bindExpandedGroupGestures(){if(this.compact&&!this._compactExpanded)return void this._expandedGroupPicker.bindIcon(null);const e=this.renderRoot.querySelector(".topology .tile.group");this._expandedGroupPicker.bindIcon(e)}render(){return this.hass&&0!==this.memberIds.length?this.compact&&!this._compactExpanded?this._renderCompact():G`
      ${this._renderTopologyTree()}
      ${this._toast?G`<div class="toast" role="status">${this._toast}</div>`:null}
    `:G`<div class="placeholder">Group not yet resolved.</div>`}};function Qe(e,t,i){if(!e||!t)return null;const o=e.states[t];if(!o)return null;if(i&&i.length>=2){const{ids:e,configs:s}=function(e){const t=[],i=new Map;if(!e)return{ids:t,configs:i};for(const o of e)if("string"==typeof o)t.push(o);else if(o&&"string"==typeof o.entity){t.push(o.entity);const{entity:e,...s}=o;i.set(o.entity,s)}return{ids:t,configs:i}}(i);if(e.length>=2)return{groupEntityId:t,memberIds:e,groupState:o,memberConfigs:s}}const s=function(e){const t=e?.attributes?.entity_id??e?.attributes?.group_entities;if(!Array.isArray(t))return null;const i=t.filter(e=>"string"==typeof e);return i.length>=2?i:null}(o);return s?{groupEntityId:t,memberIds:s,groupState:o,memberConfigs:new Map}:null}Xe._portalStylesInjected=!1,Xe.styles=He,e([ge({attribute:!1})],Xe.prototype,"hass",void 0),e([ge({type:String,attribute:"group-entity"})],Xe.prototype,"groupEntityId",void 0),e([ge({type:Array,attribute:!1})],Xe.prototype,"memberIds",void 0),e([ge({attribute:!1})],Xe.prototype,"memberConfigs",void 0),e([ge({attribute:!1})],Xe.prototype,"cycleModes",void 0),e([ge({type:String,attribute:"group-icon"})],Xe.prototype,"groupIconName",void 0),e([ge({type:String,attribute:"member-icon"})],Xe.prototype,"memberIconName",void 0),e([ge({type:String,attribute:"group-name"})],Xe.prototype,"groupName",void 0),e([ge({type:Number,attribute:"long-press-ms"})],Xe.prototype,"longPressMs",void 0),e([ge({type:String,attribute:"wheel-type"})],Xe.prototype,"wheelType",void 0),e([ge({type:Number,attribute:"wheel-hues"})],Xe.prototype,"wheelHues",void 0),e([ge({type:Number,attribute:"wheel-rings"})],Xe.prototype,"wheelRings",void 0),e([ge({type:Number,attribute:"slider-width"})],Xe.prototype,"sliderWidth",void 0),e([ge({type:Number,attribute:"slider-height"})],Xe.prototype,"sliderHeight",void 0),e([ge({type:String,attribute:"member-tap"})],Xe.prototype,"memberTap",void 0),e([ge({attribute:!1})],Xe.prototype,"groupDoubleTapAction",void 0),e([ge({type:Boolean})],Xe.prototype,"compact",void 0),e([fe()],Xe.prototype,"_compactExpanded",void 0),e([ge({type:Boolean,attribute:"expansion-sticky"})],Xe.prototype,"expansionSticky",void 0),e([fe()],Xe.prototype,"_childVisibleLeafCounts",void 0),e([ge({type:Boolean,attribute:"wheel-persistent"})],Xe.prototype,"wheelPersistent",void 0),e([ge({type:Boolean,attribute:"saved-persistent"})],Xe.prototype,"savedPersistent",void 0),e([ge({type:Boolean,attribute:"effects-editable"})],Xe.prototype,"effectsEditable",void 0),e([ge({type:Boolean,attribute:"effects-in-picker"})],Xe.prototype,"effectsInPicker",void 0),e([ge({type:Boolean,attribute:"persistent-slider-mode"})],Xe.prototype,"persistentSliderMode",void 0),e([ge({type:String,attribute:"icon-position"})],Xe.prototype,"iconPosition",void 0),e([ge({type:Boolean,attribute:"mindmap-dots"})],Xe.prototype,"mindmapDots",void 0),e([ge({attribute:!1})],Xe.prototype,"savedColorsConfig",void 0),e([fe()],Xe.prototype,"_memberModes",void 0),e([fe()],Xe.prototype,"_wheelTarget",void 0),e([fe()],Xe.prototype,"_toast",void 0),e([fe()],Xe.prototype,"_savedColorsTarget",void 0),e([fe()],Xe.prototype,"_savedColors",void 0),e([fe()],Xe.prototype,"_savedColorsEditing",void 0),e([fe()],Xe.prototype,"_effectsTarget",void 0),e([fe()],Xe.prototype,"_effectsEditMode",void 0),e([fe()],Xe.prototype,"_effectsPopupActiveOrder",void 0),e([fe()],Xe.prototype,"_topologyPopupOpen",void 0),e([fe()],Xe.prototype,"_parallelSlidersTarget",void 0),e([fe()],Xe.prototype,"_topologyAnchorRect",void 0),e([fe()],Xe.prototype,"_parallelAnchorRect",void 0),e([fe()],Xe.prototype,"_parallelPopupOrigin",void 0),e([ge({attribute:!1})],Xe.prototype,"parallelSlidersConfig",void 0),e([ge({type:Boolean,attribute:"full-length-sliders"})],Xe.prototype,"fullLengthSliders",void 0),e([ge({type:String,attribute:"expansion-mode"})],Xe.prototype,"expansionMode",void 0),e([ge({type:Boolean,attribute:"expand-in-place"})],Xe.prototype,"expandInPlace",void 0),e([ge({attribute:!1})],Xe.prototype,"iconColor",void 0),e([ge({type:Boolean,reflect:!0,attribute:"embedded"})],Xe.prototype,"embedded",void 0),e([ge({type:Number,reflect:!0,attribute:"depth"})],Xe.prototype,"depth",void 0),e([ge({type:Boolean})],Xe.prototype,"hideParent",void 0),e([ge({type:Boolean})],Xe.prototype,"showIcons",void 0),e([ge({type:Boolean})],Xe.prototype,"showMindmap",void 0),e([fe()],Xe.prototype,"_popupOrigin",void 0),e([function(e){return(t,i)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(this.renderRoot??(ve??=document.createDocumentFragment())).querySelectorAll(e)}})}(".tile.member")],Xe.prototype,"_memberTileEls",void 0),e([fe()],Xe.prototype,"_computedMemberColsGap",void 0),e([fe()],Xe.prototype,"_computedSliderWidthOverride",void 0),e([fe()],Xe.prototype,"_childMinSliderNeed",void 0),Xe=Fe=e([pe("everyday-group-layout-expanded")],Xe);const Je=[[248,141,42],[255,250,234],[200,220,255],[255,90,90],[255,220,90],[120,220,130],[120,180,250],[200,100,220]];console.info("%c EVERYDAY-LIGHT-CARD %c v1.0.2 ","color:#fff;background:#5b21b6;font-weight:700;padding:2px 6px;border-radius:3px 0 0 3px","color:#5b21b6;background:#ede9fe;font-weight:700;padding:2px 6px;border-radius:0 3px 3px 0"),window.customCards=window.customCards||[],window.customCards.push({type:"everyday-light-card",name:"Everyday Slider",description:"Slider card for lights (brightness/temp/hue/saturation) and media-players (volume). Group-aware with mindmap topology, in-place mode picker, saved-colors edit mode, vertical or horizontal orientation.",preview:!1,documentationURL:"https://github.com/f17mkx/everyday-light-card"});let Ze=class extends ce{constructor(){super(...arguments),this.embedded=!1,this.depth=0,this._effectsActiveOrder=[],this._effectsEditMode=!1,this._effectsPopupOpen=!1,this._effectsPopupOpenedAt=0,this._savedColorsState=null,this._displayModeSavedEditing=!1,this._parallelInlineCompactRuntime=void 0,this._picker=new Ye(this,{variant:"parallel-inline",longPressMs:200,hassProvider:()=>this.hass,entityIdProvider:()=>this.config?.entity,colorWheelConfigProvider:()=>this.config?.color_wheel,savedColorsConfigProvider:()=>this.config?.saved_colors,savedColorsProvider:()=>{if(this._savedColorsState)return this._savedColorsState;const e=this.config?.saved_colors;return e?.static&&Array.isArray(e.static)&&e.static.length>0?e.static:Je},onDoubleTap:()=>this._handleDoubleTap(),onEffectsPick:()=>{this._effectsPopupOpen=!0,this._effectsPopupOpenedAt=Date.now()},onSavedAddCurrent:()=>this._onSavedAddCurrent(),onSavedRemove:e=>this._onSavedRemove(e),effectsInPickerProvider:()=>!0===this.config?.effects_picker?.in_picker,onParallelMindmapPick:()=>{const e="compact"===this.config?.parallel_sliders?.layout,t=this._parallelInlineCompactRuntime??e;this._parallelInlineCompactRuntime=!t,this.requestUpdate(),this.dispatchEvent(new CustomEvent("nested-layout-change",{bubbles:!0,composed:!0,detail:{entity:this.config?.entity,reason:"parallel-toggle"}}))},parallelExpandedProvider:()=>{const e="compact"===this.config?.parallel_sliders?.layout;return!(this._parallelInlineCompactRuntime??e)}}),this._onDisplayModeColorPick=e=>{if(e.stopPropagation(),!this.hass||!this.config)return;const t=e.detail?.r,i=e.detail?.g,o=e.detail?.b;"number"==typeof t&&"number"==typeof i&&"number"==typeof o&&this.hass.callService("light","turn_on",{entity_id:this.config.entity,rgb_color:[t,i,o]})},this._onDisplayModeSavedPick=e=>{this._onDisplayModeColorPick(e)},this._onEffectPick=e=>{if(e.stopPropagation(),!this.hass||!this.config)return;const t=e.detail?.effect;t&&this.hass.callService("light","turn_on",{entity_id:this.config.entity,effect:t})},this._onEffectDelete=e=>{e.stopPropagation();const t=e.detail?.effect;if(!t||!this.hass||!this.config)return;const i=this.hass.states[this.config.entity],o=i?.attributes?.effect_list??[],s=this._effectsActiveOrder.length>0?this._effectsActiveOrder:o;this._effectsActiveOrder=s.filter(e=>e!==t),this._persistEffectsActiveToSource()},this._onEffectRestore=e=>{e.stopPropagation();const t=e.detail?.effect;if(!t||!this.hass||!this.config)return;const i=this.hass.states[this.config.entity],o=i?.attributes?.effect_list??[],s=this._effectsActiveOrder.length>0?this._effectsActiveOrder:o;s.includes(t)||(this._effectsActiveOrder=[...s,t],this._persistEffectsActiveToSource())},this._onEffectsEnterEdit=e=>{e.stopPropagation(),this._effectsEditMode=!0},this._onEffectsExitEdit=e=>{e?.stopPropagation(),this._effectsEditMode=!1},this._pickerPortal=null}_handleDoubleTap(){const e=this.config;if(!e||!this.hass)return;const t=e.gestures?.member_icon?.double_tap??e.gestures?.group_icon?.double_tap??"cycle_mode";if("none"!==t)if("toggle"!==t&&"toggle_with_restore"!==t)if("color_wheel"!==t)if("saved_colors"!==t){if("effects_list"===t)return this._effectsPopupOpen=!0,void(this._effectsPopupOpenedAt=Date.now());if("classic_more_info"===t){const t=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:e.entity}});return void this.dispatchEvent(t)}}else this._picker.openSaved();else this._picker.openWheel();else this.hass.callService("light","toggle",{entity_id:e.entity})}static async getConfigElement(){return await Promise.resolve().then(function(){return tt}),document.createElement("everyday-light-card-editor")}static getStubConfig(){return{type:"custom:everyday-light-card",entity:"light.example"}}setConfig(e){if(!((!e?.entity||"none"===e.entity)&&Array.isArray(e?.group?.manual_members)&&e.group.manual_members.length>0)&&!e?.entity)throw new Error("everyday-light-card: `entity` is required (a light.* entity_id) — OR set `entity: none` with `group.manual_members` for compound cards.");this.config=e,this.embedded=!0===e.embedded}_ensureSavedColorsState(){if(this._savedColorsState)return;const e=Be(this.hass,this.config?.saved_colors,[]);if(e)return void(this._savedColorsState=e);const t=this.config?.saved_colors?.static;if(Array.isArray(t)&&t.length>0)this._savedColorsState=t.map(e=>[e[0],e[1],e[2]]);else if(this._savedColorsState=Je.map(e=>[e[0],e[1],e[2]]),!this.config?.saved_colors?.source){const e=this.config?.entity;e&&Ge(this.hass,e).then(e=>{e&&e.length>0&&(this._savedColorsState=e,this.requestUpdate())})}}_onSavedAddCurrent(){if(!this.hass||!this.config)return;this._ensureSavedColorsState();const e=this.config.entity,t=this.hass.states[e],i=t?.attributes?.rgb_color;if(!i||3!==i.length)return;const o=t?.attributes?.color_mode,s=t?.attributes?.color_temp_kelvin,r=("color_temp"===o||!("hs"===o||"rgb"===o||"rgbw"===o||"rgbww"===o||"xy"===o)&&"number"==typeof s&&s>0)&&"number"==typeof s&&s>0?[i[0],i[1],i[2],s]:[i[0],i[1],i[2]],a=this._savedColorsState.find(e=>{if(!(Math.abs(e[0]-r[0])<5&&Math.abs(e[1]-r[1])<5&&Math.abs(e[2]-r[2])<5))return!1;const t=4===r.length?r[3]:void 0,i=4===e.length?e[3]:void 0;return void 0===t&&void 0===i||void 0!==t&&void 0!==i&&Math.abs(t-i)<50});a||(this._savedColorsState=[...this._savedColorsState,r],We(this.hass,this.config.saved_colors,this._savedColorsState),this.config.saved_colors?.source||qe(this.hass,this.config.entity,this._savedColorsState))}_onSavedRemove(e){this._ensureSavedColorsState(),e<0||e>=this._savedColorsState.length||(this._savedColorsState=[...this._savedColorsState.slice(0,e),...this._savedColorsState.slice(e+1)],We(this.hass,this.config?.saved_colors,this._savedColorsState),!this.config?.saved_colors?.source&&this.config?.entity&&qe(this.hass,this.config.entity,this._savedColorsState))}_syncEffectsActiveFromSource(){const e=this.config?.effects_picker;if(!e?.source)return;if("string"!=typeof e.source||!e.source.startsWith("helper:"))return;const t=e.source.substring(7),i=this.hass?.states[t]?.state;if(i&&"unknown"!==i&&"unavailable"!==i&&i!==this._effectsLastHelperRaw){this._effectsLastHelperRaw=i;try{const e=JSON.parse(i);if("object"!=typeof e||null===e)return;const t=e.activeOrder;if(!Array.isArray(t))return;const o=t.filter(e=>"string"==typeof e);this._effectsActiveOrder=o}catch{}}}_persistEffectsActiveToSource(){const e=this.config?.effects_picker;if(!e?.source)return;if("string"!=typeof e.source||!e.source.startsWith("helper:"))return;const t=e.source.substring(7),i=JSON.stringify({activeOrder:this._effectsActiveOrder}),o=this.hass?.states[t],s=o?.attributes?.max??100;i.length>s?console.warn(`[everyday-light-card] effects activeOrder (${i.length} chars) exceeds ${t} max (${s}). Bump the helper's max attribute.`):(this._effectsLastHelperRaw=i,this.hass?.callService("input_text","set_value",{entity_id:t,value:i}))}connectedCallback(){if(super.connectedCallback(),this._pickerPortal||(this._pickerPortal=document.createElement("div"),this._pickerPortal.className="everyday-popup-portal",document.body.appendChild(this._pickerPortal)),!document.getElementById("everyday-popup-portal-styles")){const e=document.createElement("style");e.id="everyday-popup-portal-styles",e.textContent=Te,document.head.appendChild(e)}}disconnectedCallback(){super.disconnectedCallback(),this._pickerPortal&&(le(G``,this._pickerPortal),this._pickerPortal.remove(),this._pickerPortal=null)}updated(){this._syncEffectsActiveFromSource();const e=this.renderRoot.querySelector(".parallel-mindmap-icon"),t=this.renderRoot.querySelector(".single-icon"),i=this.renderRoot.querySelector(".parallel-compact-icon");this._picker.bindIcon(e??i??t),this._pickerPortal&&le(G`${this._picker.renderWheel()}${this._picker.renderSaved()}${this._renderEffectsPopup()}`,this._pickerPortal)}_renderEffectsPopup(){if(!this._effectsPopupOpen||!this.hass||!this.config)return null;const e=this.hass.states[this.config.entity];if(!e)return null;const t=e.attributes.effect_list??[];if(0===t.length)return this._effectsPopupOpen=!1,null;const i=()=>{this._effectsPopupOpen=!1,this.requestUpdate()};return G`
      <div
        class="effects-popup-backdrop"
        style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 199; pointer-events: auto;"
        @click=${e=>{e.stopPropagation(),Date.now()-this._effectsPopupOpenedAt<300||i()}}
      >
        <div
          class="inplace-popup effects"
          style="left: 50%; top: 50%; width: min(360px, 90vw); max-height: min(70vh, 540px); padding: 18px; overflow: auto;"
          @click=${e=>e.stopPropagation()}
        >
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 500; color: var(--primary-text-color, #fff);">Effects</div>
            <button
              class="popup-close"
              style="width:28px; height:28px; border-radius:50%; border:none; background:rgba(255,255,255,0.08); color:var(--primary-text-color,#fff); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;"
              @click=${i}
            >×</button>
          </div>
          <everyday-effects-list-picker
            .effects=${t}
            .activeOrder=${this._effectsActiveOrder}
            .editMode=${!1}
            .longPressMs=${200}
            @effect-pick=${e=>{this._onEffectPick(e),i()}}
          ></everyday-effects-list-picker>
        </div>
      </div>
    `}getCardSize(){if(this.hass&&this.config){if(Qe(this.hass,this.config.entity,this.config.group?.manual_members))return 6}return 4}_renderContainerCard(){const e=this.config,t=e.group??{},i=t.manual_members??[],o=new Map,s=[];for(const e of i)"string"==typeof e?s.push(e):e&&"object"==typeof e&&e.entity&&(s.push(e.entity),o.set(e.entity,e));const r="show"!==e.parent_node,a=!1!==e.show_icons,n=!1!==e.show_mindmap,l=G`
      <everyday-group-layout-expanded
        .hass=${this.hass}
        group-entity=${""}
        .memberIds=${s}
        .memberConfigs=${o}
        .groupName=${e.name??""}
        .groupIconName=${e.icon}
        .longPressMs=${e.gestures?.long_press_ms??200}
        .memberTap=${"toggle"}
        .groupDoubleTapAction=${e.gestures?.group_icon?.double_tap}
        .wheelType=${"smooth"===e.color_wheel?.type?"smooth":"stepped"}
        .wheelHues=${e.color_wheel?.hue_segments??21}
        .wheelRings=${e.color_wheel?.saturation_rings??6}
        .sliderWidth=${e.slider?.width}
        .sliderHeight=${e.slider?.height}
        .compact=${!1}
        .wheelPersistent=${!1!==e.color_wheel?.persistent}
        .savedPersistent=${!1!==e.saved_colors?.persistent}
        .persistentSliderMode=${!0===e.slider?.persistent_mode}
        .iconPosition=${"top"===t.icon_position?"top":"bottom"}
        .mindmapDots=${"boolean"==typeof t.mindmap_dots&&t.mindmap_dots}
        .savedColorsConfig=${e.saved_colors}
        .parallelSlidersConfig=${e.parallel_sliders}
        .fullLengthSliders=${!0===t.full_length_sliders}
        .expansionMode=${t.expansion_mode??"inline"}
        .expandInPlace=${!0===t.expand_in_place}
        .iconColor=${e.icon_color}
        .cycleModes=${e.cycle?.modes}
        .effectsEditable=${!1!==e.effects_picker?.editable}
        .effectsInPicker=${!0===e.effects_picker?.in_picker}
        .expansionSticky=${!0===t.expansion_sticky}
        .embedded=${!0===e.embedded}
        .depth=${this.depth}
        .hideParent=${r}
        .showIcons=${a}
        .showMindmap=${n}
      ></everyday-group-layout-expanded>
    `;return!0===e.embedded?l:G`<ha-card>${l}</ha-card>`}render(){if(!this.config||!this.hass)return G`<ha-card><div class="placeholder">everyday-light-card loading...</div></ha-card>`;if((!this.config.entity||"none"===this.config.entity)&&Array.isArray(this.config.group?.manual_members)&&this.config.group.manual_members.length>0)return this._renderContainerCard();const e=this.hass.states[this.config.entity];if(!e)return G`<ha-card><div class="placeholder error">Entity ${this.config.entity} not found.</div></ha-card>`;const t=this.config.entity.split(".")[0];if("light"!==t&&"media_player"!==t)return G`<ha-card><div class="placeholder error">
        Entity must be a <code>light.*</code> or <code>media_player.*</code> entity (got <code>${this.config.entity}</code>).
      </div></ha-card>`;if("color-wheel"===this.config.default_view_mode&&"light"===t){const t="smooth"===this.config.color_wheel?.type?"smooth":"stepped",i=this.config.color_wheel?.hue_segments??24,o=this.config.color_wheel?.saturation_rings??8,s=this.config.name??e.attributes.friendly_name??this.config.entity;return G`
        <ha-card>
          <div class="display-mode-card">
            <div class="display-mode-title">${s}</div>
            <div class="display-mode-wheel-wrap">
              <everyday-color-wheel
                wheel-type=${t}
                hues=${i}
                rings=${o}
                @color-pick=${this._onDisplayModeColorPick}
              ></everyday-color-wheel>
            </div>
          </div>
        </ha-card>
      `}if("saved-colors"===this.config.default_view_mode&&"light"===t){this._ensureSavedColorsState();const t=this.config.name??e.attributes.friendly_name??this.config.entity;return G`
        <ha-card>
          <div class="display-mode-card">
            <div class="display-mode-title">
              ${t}${this._displayModeSavedEditing?" · edit":""}
            </div>
            <everyday-saved-colors-picker
              .colors=${this._savedColorsState??[]}
              .editMode=${this._displayModeSavedEditing}
              @color-pick=${this._onDisplayModeSavedPick}
              @add-current=${()=>this._onSavedAddCurrent()}
              @remove-color=${e=>{const t=e.detail?.index;"number"==typeof t&&this._onSavedRemove(t)}}
              @enter-edit=${()=>{this._displayModeSavedEditing=!0}}
              @done-editing=${()=>{this._displayModeSavedEditing=!1}}
            ></everyday-saved-colors-picker>
          </div>
        </ha-card>
      `}if("effects-picker"===this.config.default_view_mode&&"light"===t){const t=e.attributes.effect_list??[],i=this.config.name??e.attributes.friendly_name??this.config.entity;return G`
        <ha-card>
          <div class="effects-card">
            <div class="effects-title">${i}${this._effectsEditMode?" · edit":""}</div>
            <everyday-effects-list-picker
              .effects=${t}
              .activeOrder=${this._effectsActiveOrder}
              .editMode=${this._effectsEditMode}
              .editable=${!1!==this.config.effects_picker?.editable}
              .longPressMs=${this.config.gestures?.long_press_ms??200}
              @effect-pick=${this._onEffectPick}
              @delete-effect=${this._onEffectDelete}
              @restore-effect=${this._onEffectRestore}
              @enter-edit=${this._onEffectsEnterEdit}
              @exit-edit=${this._onEffectsExitEdit}
            ></everyday-effects-list-picker>
          </div>
        </ha-card>
      `}if("parallel"===this.config.default_view_mode&&"light"===t&&1===this.config.parallel_sliders?.modes?.length);else if("parallel"===this.config.default_view_mode&&"light"===t){const t=this.config,i=this._parallelInlineCompactRuntime??"compact"===t.parallel_sliders?.layout,o=i?["brightness"]:t.parallel_sliders?.modes??["brightness","temperature","hue","saturation"],s=!0===t.parallel_sliders?.show_labels,r=(t.parallel_sliders,t.slider?.height??270),a=!0===t.group?.expand_in_place,n="compact"===t.parallel_sliders?.layout,l=68,d=a&&n&&!i?Math.max(80,r-l):r,c=t.name??e.attributes.friendly_name??t.entity,h=t.icon,p=e.attributes.icon,u=h??p??"mdi:lightbulb",m="on"===e.state,g=e.attributes.rgb_color,f=e.attributes.brightness,v=Ie(t.icon_color,m,g,f),y=o.map(()=>({state:e.state,rgb:g,brightness:e.attributes.brightness})),b=i?G`
            <!-- Stefan-2026-05-12 PA-0002 (R3): parallel_sliders.layout: compact
                 DOM order flipped — sliders FIRST, then icon below. Pre-PA-0002
                 the icon rendered ABOVE the slider-row; Stefan-Quote: "the
                 icon for hall boxes is shown on top of the slider. it needs
                 to be below the slider". The .single-picker overlay tracks
                 the new icon position via bottom-anchored CSS (see styles
                 below). caption stays last. -->
            <div class="parallel-compact-layout">
              <div class="parallel-slider-row">
                ${o.map(e=>G`
                    <div class="parallel-inline-col">
                      ${s?G`<span class="parallel-inline-lbl">${e}</span>`:null}
                      <everyday-vertical-pill-slider
                        style=${`--everyday-slider-height: ${d}px`}
                        .hass=${this.hass}
                        .entity=${t.entity}
                        .mode=${e}
                      ></everyday-vertical-pill-slider>
                    </div>
                  `)}
              </div>
              <ha-state-icon
                class="parallel-compact-icon ${m?"active":""}"
                style=${v}
                data-interactive=${t.gestures?.member_icon?"true":null}
                .hass=${this.hass}
                .stateObj=${e}
                .icon=${u}
              ></ha-state-icon>
              <div class="single-picker">${this._picker.renderPicker()}</div>
              <div class="caption">
                <span class="name">${c}</span>
              </div>
            </div>
          `:G`
            <div class="parallel-mindmap-layout">
              <div class="parallel-slider-row">
                ${o.map(e=>G`
                    <div class="parallel-inline-col">
                      ${s?G`<span class="parallel-inline-lbl">${e}</span>`:null}
                      <everyday-vertical-pill-slider
                        style=${`--everyday-slider-height: ${d}px`}
                        .hass=${this.hass}
                        .entity=${t.entity}
                        .mode=${e}
                      ></everyday-vertical-pill-slider>
                    </div>
                  `)}
              </div>
              <div class="parallel-mindmap-area">
                <everyday-mindmap-path
                  class="parallel-mindmap-bg"
                  aria-hidden="true"
                  .members=${y}
                  .dotsEnabled=${!1}
                  .groupDotEnabled=${!0}
                  .groupYOverride=${60}
                  .memberYOverride=${10}
                  .groupOn=${m}
                  .groupRgb=${g}
                ></everyday-mindmap-path>
                <ha-state-icon
                  class="parallel-mindmap-icon ${m?"active":""}"
                  style=${v}
                  .hass=${this.hass}
                  .stateObj=${e}
                  .icon=${u}
                ></ha-state-icon>
                <div class="parallel-picker">${this._picker.renderPicker()}</div>
              </div>
              <div class="caption">
                <span class="name">${c}</span>
              </div>
            </div>
          `;return!0===t.embedded?b:G`<ha-card>${b}</ha-card>`}const i=this.config.group??{},o=Qe(this.hass,this.config.entity,i.manual_members);if(o){const e=this.config,t=e.gestures?.long_press_ms??200,s="none"===e.gestures?.member_icon?.tap||"classic_more_info"===e.gestures?.member_icon?.tap?e.gestures.member_icon.tap:"toggle",r="smooth"===e.color_wheel?.type?"smooth":"stepped",a=e.color_wheel?.hue_segments??21,n=e.color_wheel?.saturation_rings??6,l=e.slider?.width,d=e.slider?.height,c="compact"===i.layout,h=!1!==e.color_wheel?.persistent,p=!1!==e.saved_colors?.persistent,u=!0===e.slider?.persistent_mode,m="top"===i.icon_position?"top":"bottom",g="boolean"==typeof i.mindmap_dots?i.mindmap_dots:"top"!==m,f=G`
        <everyday-group-layout-expanded
          .hass=${this.hass}
          group-entity=${o.groupEntityId}
          .memberIds=${o.memberIds}
          .memberConfigs=${o.memberConfigs}
          .groupName=${e.name}
          .groupIconName=${e.icon}
          .longPressMs=${t}
          .memberTap=${s}
          .groupDoubleTapAction=${e.gestures?.group_icon?.double_tap}
          .wheelType=${r}
          .wheelHues=${a}
          .wheelRings=${n}
          .sliderWidth=${l}
          .sliderHeight=${d}
          .compact=${c}
          .wheelPersistent=${h}
          .savedPersistent=${p}
          .persistentSliderMode=${u}
          .iconPosition=${m}
          .mindmapDots=${g}
          .savedColorsConfig=${e.saved_colors}
          .parallelSlidersConfig=${e.parallel_sliders}
          .fullLengthSliders=${!0===i.full_length_sliders}
          .expansionMode=${i.expansion_mode??"inline"}
          .expandInPlace=${!0===i.expand_in_place}
          .iconColor=${e.icon_color}
          .cycleModes=${e.cycle?.modes}
          .effectsEditable=${!1!==e.effects_picker?.editable}
          .effectsInPicker=${!0===e.effects_picker?.in_picker}
          .expansionSticky=${!0===i.expansion_sticky}
          .embedded=${!0===e.embedded}
          .depth=${this.depth}
          .hideParent=${"hide"===e.parent_node}
          .showIcons=${!1!==e.show_icons}
          .showMindmap=${!1!==e.show_mindmap}
        ></everyday-group-layout-expanded>
      `;return!0===e.embedded?f:G`<ha-card>${f}</ha-card>`}const s=("parallel"===this.config.default_view_mode&&1===this.config.parallel_sliders?.modes?.length?this.config.parallel_sliders.modes[0]:void 0)??this.config.mode;let r;r="temperature"===s||"volume"===s||"brightness"===s||"hue"===s||"saturation"===s?s:"media_player"===t?"volume":"brightness";const a="horizontal"===this.config.slider?.orientation?"horizontal":"vertical",n="mixer"===this.config.slider?.style?"mixer":"pill",l=!0===this.config.slider?.show_buttons,d=this.config.name??e.attributes.friendly_name??this.config.entity,c=[this.config.slider?.width?`--everyday-slider-width: ${this.config.slider.width}px`:"",this.config.slider?.height?`--everyday-slider-height: ${this.config.slider.height}px`:""].filter(Boolean).join("; ");if("mixer"===n&&"media_player"===t&&l){const t=this.config.entity,i=()=>{this.hass?.callService("media_player","volume_down",{entity_id:t})},o=()=>{this.hass?.callService("media_player","volume_up",{entity_id:t})},s="playing"===e.state,r=()=>{this.hass&&(s?this.hass.callService("media_player","media_pause",{entity_id:t}):this.hass.callService("media_player","media_play",{entity_id:t}))},a=(()=>{switch(e.state){case"playing":return"playing";case"paused":return"paused";case"idle":return"idle";case"buffering":return"buffering";case"on":return"on";case"off":return"";case"unavailable":return"offline";default:return e.state}})(),n=this.config.icon??e.attributes.icon??"mdi:speaker";return G`
        <ha-card class="speaker-row-card">
          <div class="speaker-row v2 ${s?"playing":""}" style=${c}>
            <ha-state-icon class="speaker-icon" .stateObj=${e} .icon=${n}></ha-state-icon>
            <div class="speaker-name-col">
              <span class="speaker-name">${d}</span>
              ${a?G`<span class="speaker-state">${a}</span>`:""}
            </div>
            <everyday-vertical-pill-slider
              class="speaker-slider"
              .hass=${this.hass}
              .entity=${this.config.entity}
              .mode=${"volume"}
              .orientation=${"horizontal"}
              .styleVariant=${"mixer"}
            ></everyday-vertical-pill-slider>
            <button class="speaker-btn" type="button" @click=${i} aria-label="Volume down">−</button>
            <button class="speaker-btn" type="button" @click=${o} aria-label="Volume up">+</button>
            <button
              class="speaker-btn play-pause"
              type="button"
              @click=${r}
              aria-label=${s?"Pause":"Play"}
            >${s?"⏸":"▶"}</button>
          </div>
        </ha-card>
      `}const h=this.config.icon,p=e.attributes.icon,u=h??p??("media_player"===t?"mdi:speaker":"mdi:lightbulb"),m="on"===e.state,g=e.attributes.rgb_color,f=e.attributes.brightness,v=Ie(this.config.icon_color,m,g,f);return"horizontal"===a?G`
        <ha-card class="hpill-card">
          <div class="hpill-row" style=${c}>
            <div class="single-icon-wrap">
              <ha-icon class="single-icon ${m?"active":""}" icon=${u} style=${v}></ha-icon>
              <!-- Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): see comment
                   on the vertical-orientation render for rationale. Single-
                   icon must own a picker overlay slot for long-press to
                   render anything. -->
              <div class="single-picker">${this._picker.renderPicker()}</div>
            </div>
            <everyday-vertical-pill-slider
              class="hpill-slider"
              .hass=${this.hass}
              .entity=${this.config.entity}
              .mode=${r}
              .orientation=${"horizontal"}
              .styleVariant=${n}
            ></everyday-vertical-pill-slider>
            <div class="hpill-caption">
              <span class="name">${d}</span>
              <!-- Stefan-2026-05-12 R324 (PA-0005): drop on/off from state-line.
                   Keep mode-suffix when mode is not default brightness, since
                   that conveys real info (which slider axis is active). -->
              ${"temperature"===r||"volume"===r?G`<span class="state">${"temperature"===r?"temp":"vol"}</span>`:""}
            </div>
          </div>
        </ha-card>
      `:G`
      <ha-card>
        <div class="container ${a}" style=${c}>
          <everyday-vertical-pill-slider
            .hass=${this.hass}
            .entity=${this.config.entity}
            .mode=${r}
            .orientation=${a}
            .styleVariant=${n}
          ></everyday-vertical-pill-slider>
          <div class="caption">
            <div class="single-icon-wrap">
              <ha-state-icon
                class="single-icon ${m?"active":""}"
                data-interactive=${this.config.gestures?.member_icon?"true":null}
                style=${v}
                .hass=${this.hass}
                .stateObj=${e}
                .icon=${u}
              ></ha-state-icon>
              <!-- Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): mount the
                   picker overlay here so long-press on the .single-icon has
                   a DOM container to render its 4-option ring into.
                   Pre-r63e: r62 R289 wired bindIcon(.single-icon) so the
                   gesture detector DID fire, but renderPicker() was only
                   rendered in the parallel-mode path — long-press silently
                   opened a picker that had nowhere to show. Same picker
                   instance as the parallel-mode mount, just positioned
                   around the single-icon when this render path is active. -->
              <div class="single-picker">${this._picker.renderPicker()}</div>
            </div>
            <span class="name">${d}</span>
            <!-- Stefan-2026-05-12 R324 (PA-0005): drop on/off from state-line.
                 Keep mode-suffix when mode is not default brightness, since
                 that conveys real info (which slider axis is active). -->
            ${"temperature"===r||"volume"===r?G`<span class="state">${"temperature"===r?"temp":"vol"}</span>`:""}
          </div>
        </div>
      </ha-card>
    `}};Ze.styles=a`
    :host {
      display: block;
      /* Stefan-2026-05-09 P12 R99: stretch to horizontal-stack height so
         all cards in a row match the tallest. Lovelace horizontal-stack
         flex-stretches its children; this propagates down to ha-card. */
      height: 100%;
    }
    /* Stefan-2026-05-11 R261: embedded cards now sit at their NATURAL
       intrinsic height at col-top (no flex-end packing). The previous
       R248-R252 flex-end was forcing all siblings to col-bottom — visually
       uniform but flattened depth-info Stefan now wants visible (PA-09:
       "die höhe der dots für main und back muss unterschiedlich sein,
       weil Main viel höher ist als Back"). With R262 .member-cols {
       align-items: start } in group-layout-expanded.styles, each col is
       content-sized; embedded host fills the col naturally, its group-icon
       sits at content-bottom = card-bottom. Cards with less depth (Main)
       end higher than cards with more depth (Back). Mindmap dots track
       per-member-Y via the memberYs prop. Kept: position:relative +
       z-index:3 (R248 stacking-context fix for long-press hit-testing). */
    :host([embedded]) {
      position: relative;
      z-index: 3;
      /* Stefan-2026-05-11 R271: stretch the embedded card to fill its
         parent .member-col which itself stretches via the new R271
         justify-items stretch on .member-cols. Without width 100%,
         the host stays content-width centered inside the col, leaving
         a visible empty channel between sibling cards. With this, the
         card spans the full col, its inner member-cols grid fills,
         sliders distribute evenly across the parent's slice of the
         card width. Stefan PA-12: die slider sollen die ganze breite
         der Karte einnehmen. */
      width: 100%;
    }
    /* Stefan-2026-05-12 R351 (PA-0019): embedded parallel-inline cards
       (variants .parallel-mindmap-layout for expanded, .parallel-compact-
       layout for compact) carry default 24/8 px padding designed for the
       STANDALONE single-light card surface. When embedded as a nested
       member of a parent group, the parent's .member-col already provides
       the layout context — extra padding pushes the embedded slider DOWN
       relative to sibling sliders that have no such padding, producing a
       "boxes slider is slightly lower than the others" visual artifact
       (Stefan-Quote PA-0019). Drop padding when embedded so the slider
       top aligns with siblings exactly. Mirror of the
       :host([embedded]) .layout { padding: 0 } rule already present on
       group-layout-expanded.styles.ts:118-122 for the same reason.
       R111-safe: no backticks in CSS comments. */
    :host([embedded]) .parallel-mindmap-layout,
    :host([embedded]) .parallel-compact-layout {
      padding: 0;
    }
    ha-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ha-card > .container,
    ha-card > .parallel-mindmap-layout,
    ha-card > .effects-card,
    ha-card > .hpill-row,
    ha-card > .speaker-row {
      flex: 1 1 auto;
    }
    /* Stefan-2026-05-09 P47 R31d — default_view_mode: parallel renders N
       sliders side-by-side inline (no popup). Same column model as the
       parallel-popup: label on top, slider below. */
    .parallel-inline {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      /* Stefan-2026-05-12 P15.6-r63l (R313 / PA-0043): 24px parity with
         .container / .layout / .layout.compact (R303). Pre-r63k was
         16/16/20 — visually short on the bottom. */
      padding: 24px;
    }
    /* Stefan-2026-05-09 P47-fix R52: parallel-inline icon = mindmap-node
       circle (same as single-entity .caption .single-icon). */
    .parallel-inline .single-icon {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--paper-item-icon-color, #c1c1c1);
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      box-sizing: border-box;
    }
    .parallel-inline .single-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }

    /* Stefan-2026-05-09 P47-fix R54: shared layout for single-entity and
       parallel-inline cards. Slider(s) on top, mindmap-arms SVG in the
       middle (1 arm for N=1, N arms for parallel), group-icon-circle at
       bottom, name+state. The mindmap connects slider(s) to the icon
       visually — at N=1 the arm is a vertical line, at N>1 the arms fan
       out from the central group-dot. */
    .parallel-mindmap-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      /* Stefan-2026-05-12 P15.6-r63l (R313 / PA-0043): 24px parity with
         .container / .layout / .layout.compact (R303). Pre-r63k was
         14/14/16 — different from every other render surface, Stefan
         flagged "padding is wrong ... I dont understand how it can be
         different". */
      padding: 24px;
      /* P12 R97: position:relative anchor for the wheel-overlay child. */
      position: relative;
    }
    /* Stefan-2026-05-12 R327 (PA-0008): compact variant of parallel-inline.
       Drops the .parallel-mindmap-area SVG + orbiting icon. Used for nested
       embedded members where the surrounding card's mindmap arms already
       provide topology. Layout: small icon on top, slider-row below, no
       curve-bg, minimal padding. */
    .parallel-compact-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px;
      position: relative;
    }
    /* Stefan-2026-05-12 R344 (PA-0017): apply the mindmap-node chrome
       (dark fill + gold border) to .parallel-compact-icon so it matches
       the other compact-collapsed group icons (.tile.group.compact-target
       .ic in group-layout-expanded.styles.ts:423-432, AND the single-icon
       in .caption .single-icon at line 1713-1726 below). Stefan-Quote:
       "bei R3 fehlt auch der mindmap dot und der runde hintergrund um das
       icon (damit der slider genau so aussieht wie die anderen)". Pre-r344
       the parallel-compact-icon was a bare ha-state-icon without the
       round dark dot + gold ring — visually inconsistent with every other
       group/single icon that uses the mindmap-node identity.
       R111-safe: no backticks in CSS comments. */
    .parallel-compact-icon {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--paper-item-icon-color, #c1c1c1);
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      box-sizing: border-box;
      pointer-events: auto;
      /* R326: bound element + must declare touch-action statically. */
      touch-action: none;
    }
    .parallel-compact-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    /* Stefan-2026-05-12 PA-0002 (R3): picker anchor moved from top (22 px
       from layout-top where the icon used to live) to bottom (~47 px from
       layout-bottom where the icon NOW lives, after the DOM-order flip
       that put sliders first and icon below). Math: caption ≈ 25 px +
       parallel-compact-layout gap 8 px + half-icon 14 px = 47 px from
       layout's padding-bottom edge to icon-center. mode-picker host has
       size 0×0 so translate(-50%, -50%) is a no-op visually but kept
       for semantic parity with other picker anchors.
       Stefan-2026-05-12 R344 (PA-0017): icon size grew from 28→46 px
       (mindmap-node chrome). New half-icon = 23 px → bottom = 25 + 8 + 23
       = 56 px so the picker still orbits around the icon-center. Without
       this update the picker would sit ~9 px below the icon (= 23-14). */
    .parallel-compact-layout .single-picker {
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      z-index: 41;
      touch-action: none;
    }
    .parallel-slider-row {
      display: flex;
      flex-direction: row;
      /* Stefan-2026-05-12 R350 (PA-0019): minimum gap so sliders don't
         visually butt against each other in narrow containers. Stefan-
         Quote PA-0019: "when expanded and when there is enough space the
         paralell sliders are 0px apart (no gap between them)". With
         gap=14, even a tight container shows clear separation. space-
         around adds additional spacing on top of the gap when there's
         slack — so wider containers naturally distribute more space
         between sliders while still respecting the floor. Mindmap-arms
         still anchor at slider-centers via space-around's distribution
         (the item's center stays the same; only the BETWEEN-spacing
         changes by +14 px which is small enough that arm-misalignment
         is not visually noticeable). */
      gap: 14px;
      /* Stefan-2026-05-09 P12 R103: space-around distributes the sliders
         exactly where mindmap-path's simple (i+0.5)/N * W formula puts
         the memberX positions, so the arms hit slider-centers without
         a gap-aware adjustment dance. */
      justify-content: space-around;
      align-items: flex-end;
      width: 100%;
    }
    .parallel-slider-row .parallel-inline-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .parallel-slider-row .parallel-inline-lbl {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
    }
    /* Stefan-2026-05-09 P47-fix R58: SVG renders groupDot circle + curves;
       HTML icon-glyph overlays groupDot center. SVG height 90px so c1
       control points (groupY - vs*0.05 with vs ≈ 70) leave the group dot
       horizontally — matches the Card 6 expanded view aesthetic. The
       icon-glyph itself has NO border or background; the SVG groupDot
       provides the state-reactive circle. */
    .parallel-mindmap-area {
      position: relative;
      width: 100%;
      height: 90px;
      flex: 0 0 auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parent overlay covering
         the icon + picker dots. Without touch-action none here, finger drifting
         off .dot back onto this wrapper re-evaluates the chain and unlocks
         scroll. Belt-and-suspenders with .parallel-mindmap-icon's own rule. */
      touch-action: none;
    }
    .parallel-mindmap-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .parallel-mindmap-icon {
      position: absolute;
      /* Stefan-2026-05-12 R343 (PA-0017): switched from bottom+translateX
         to top+translate(-50%,-50%) so the icon's geometric center lands
         exactly at y=60 from container-top — same Y as the SVG groupDot
         (groupYOverride=60 in the 90 px-tall .parallel-mindmap-area).
         Pre-r343 bottom:17 math was correct on paper (90-17=73, 73-13=60),
         but bottom-anchored positioning is sensitive to sub-pixel rounding
         in some HA themes when --mdc-icon-size is overridden — caused the
         icon to drift 1-3 px in real renders. top+translate(-50%,-50%)
         pins the visual center deterministically. */
      top: 60px;
      left: 50%;
      transform: translate(-50%, -50%);
      --mdc-icon-size: 26px;
      color: var(--paper-item-icon-color, #c1c1c1);
      pointer-events: auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parallel-inline bind-target.
         Per W3C pointer-events-3 spec the touch-action chain is read at first
         pointerdown and frozen for the gesture's lifetime — R323's late
         scroll-lock at the 200ms long-press timer can't undo a scroll commit
         the browser made by the first pointermove. Mirror of .single-icon
         [data-interactive] declaration. */
      touch-action: none;
    }
    .parallel-mindmap-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    .parallel-mindmap-layout > .caption {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-top: 6px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
    }
    .parallel-mindmap-layout > .caption .name { font-weight: 500; }
    .parallel-mindmap-layout > .caption .state {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .parallel-inline-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      text-align: center;
    }
    .parallel-inline-row {
      display: flex;
      gap: 22px;
      align-items: flex-end;
      justify-content: center;
    }
    .parallel-inline-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .parallel-inline-lbl {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      /* Stefan-2026-05-11 P15.6-r63f (R303-followup / PA-0033): padding
         16 -> 24 px so single-light .container matches .layout (24 px)
         and .layout.compact (24 px from r63e). Stefan-Quote PA-0033:
         "fix alles" — covers the r63e follow-up note "single-light
         .container also at 24 px to keep all 3 surfaces matching".
         Visual outcome: single-light cards gain 8 px on each side. */
      padding: 24px;
    }
    .caption {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
    }
    .caption .name {
      font-weight: 500;
    }
    .caption .state {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    /* Stefan-2026-05-09 P47-fix R52: single-entity card icon-tile is now
       a mindmap-node-style circle — gold stroke when off, entity-rgb
       stroke when on. Matches the visual identity of the group-icon-circle
       in the expanded view's mindmap. Stefan-Decision: "die 1 Mindmap ist
       nur ein Kreis, ohne Arme" (= just the circle, no arms; arms are
       only meaningful for N≥2 multi-axis layouts). */
    .caption .single-icon {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--paper-item-icon-color, #c1c1c1);
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      margin-bottom: 4px;
      box-sizing: border-box;
    }
    .caption .single-icon.active {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    /* Stefan-2026-05-11 R289 (PA-14): when gestures.member_icon is set
       in config, the single-icon is bound to the picker (long-press =>
       wheel/saved popup; double-tap => configured action). Make the
       interactivity visible via hand-cursor on hover, and disable native
       touch-action so the gesture-detector pointer events aren't hijacked
       by scroll/pinch on touch devices. R111-safe: no backticks in CSS comments. */
    .caption .single-icon[data-interactive] {
      cursor: pointer;
      touch-action: none;
    }
    /* Stefan-2026-05-11 P15.6-r63e (R301 / PA-0032): wrapper around the
       .single-icon so the picker overlay can be absolutely positioned
       centered over the icon. Without this wrap the picker overlay would
       size relative to .caption (slider + name + state column) and end up
       offset. Reuses the same z-index ceiling as .parallel-mindmap-area
       and the same overlay positioning as .parallel-picker. Applies to
       BOTH the vertical .caption layout AND the horizontal .hpill-row
       layout. R111-safe: no backticks in CSS comments. */
    .single-icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .single-icon-wrap .single-picker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      z-index: 41;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): parent overlay covering
         drag-traversal between dots. Mirror of .parallel-picker. */
      touch-action: none;
    }
    /* Stefan-2026-05-09 P47-fix R47: horizontal-pill row layout —
       [icon | slider | name+state]. Mirrors the speaker-row mixer card but
       without the volume buttons. Slider gets flex-grow so it stretches to
       fill the available width between icon and caption. */
    ha-card.hpill-card {
      background: rgba(0, 0, 0, 0.5);
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border: none;
    }
    .hpill-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 14px;
      /* Stefan-2026-05-11 P15.6-r63f (R303-followup / PA-0033): bumped
         horizontal padding 16 -> 24 px to match .container / .layout /
         .layout.compact uniform 24 px padding. Vertical 10 px kept so
         the row stays narrow enough to fit horizontal-stack rows of
         multiple pill cards. */
      padding: 10px 24px;
    }
    .hpill-slider {
      width: 100%;
    }
    .hpill-caption {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 13px;
      min-width: 80px;
      text-align: right;
    }
    .hpill-caption .name { font-weight: 500; }
    .hpill-caption .state { font-size: 11px; color: var(--secondary-text-color); }

    /* Stefan-2026-05-10 P15.6-fix R121: picker wrapper anchored at icon
       CENTER, not icon-bottom. Icon: bottom:17, halfsize:13 → center at
       bottom:30. Wrapper has 0×0 size; the mode-picker child renders its
       picker dots orbiting around wrapper origin, so origin == icon-center
       lands the dots correctly around the icon. Stefan-2026-05-10:
       previously without wrapper the dots landed at .parallel-mindmap-area
       top-left ("zu weit links und zu weit oben").
       Stefan-2026-05-12 R343 (PA-0017): switched from bottom-anchor to
       top-anchor + translate(-50%, -50%) for sub-pixel-stable centering.
       Same Y as .parallel-mindmap-icon (top:60) so the picker dots orbit
       exactly around the icon-center. Pre-r343 bottom:30 math was correct
       (height 90 - 30 = 60) but bottom-anchored positioning drifted in
       some HA themes — the picker halo appeared a few px above the icon. */
    .parallel-mindmap-area .parallel-picker {
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 41;
      pointer-events: auto;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): finger drifting between
         dots crosses this wrapper. Without touch-action none the chain
         re-evaluates and the browser can claim the touch. */
      touch-action: none;
    }
    .parallel-picker-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      pointer-events: auto;
    }
    /* Stefan-2026-05-09 P12 R97: parallel-inline wheel-overlay on long-press
       of the parallel-mindmap-icon. MVP: full-card overlay with the wheel
       centered. Outside-click closes; click on the wheel itself
       stops-propagation so the user can pick. */
    .parallel-wheel-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      animation: parallel-wheel-fade-in 180ms ease-out;
    }
    .parallel-wheel-popup {
      transform: scale(0.95);
      animation: parallel-wheel-bloom 200ms cubic-bezier(0.16, 1.06, 0.46, 1.04) forwards;
    }
    @keyframes parallel-wheel-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes parallel-wheel-bloom {
      0%   { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1);   opacity: 1; }
    }

    /* Stefan-2026-05-09 P12 R95: mobile responsive. Demo broken on iPhone-
       width screens. Quick wins: shrink padding, allow slider-row to wrap
       (so 4-axis parallel doesn't overflow), reduce slider gap. */
    @media (max-width: 480px) {
      .parallel-mindmap-layout {
        padding: 10px 8px 12px;
      }
      .parallel-slider-row {
        gap: 12px;
        flex-wrap: wrap;
      }
      .parallel-mindmap-area {
        height: 70px;
      }
      .container {
        padding: 12px;
      }
      .effects-card {
        padding: 12px 8px 14px;
      }
      .hpill-row {
        grid-template-columns: auto 1fr;
        gap: 10px;
        padding: 8px 12px;
      }
      .hpill-caption {
        display: none;
      }
    }

    /* Stefan-2026-05-09 P38.1: effects-picker standalone card layout. */
    .effects-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 14px 16px;
      align-items: center;
    }
    .effects-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      font-weight: 500;
    }
    /* Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): standalone color-wheel /
       saved-colors display-mode card layout. Mirrors .effects-card so the
       three "no-slider" picker tiles share the same chrome. */
    .display-mode-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px 14px 16px;
      align-items: center;
    }
    .display-mode-title {
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-size: 14px;
      font-weight: 500;
    }
    .display-mode-wheel-wrap {
      width: 100%;
      max-width: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
    }
    .display-mode-wheel-wrap everyday-color-wheel {
      width: 100%;
    }

    .placeholder {
      padding: 16px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      line-height: 1.5;
    }
    .placeholder.error {
      color: var(--error-color, #c62828);
    }
    code {
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.05));
      padding: 1px 4px;
      border-radius: 3px;
      font-family: var(--code-font-family, 'Roboto Mono', monospace);
    }

    /* Stefan-2026-05-10 R163-step1 + R167 - speaker-row layout v2:
       - Bubble-Card-inspired: -/+ buttons styled like the brightness-slider
         thumb (white pill, dark text). Stefan: "+ / - buttons sollen
         aussehen wie der Thumb des brightness sliders".
       - Card no longer stretches to row-max height (speaker demo card was
         huge because horizontal-stack flex-stretch propagated through the
         global ha-card height:100% rule). Override here so the card hugs
         its 56 px row.
    */
    ha-card.speaker-row-card {
      background: var(--card-background-color, rgba(0, 0, 0, 0.5));
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      border: none;
      /* R167: override global ha-card height:100% so the card doesn't
         stretch to its parent flex/grid row-max. */
      height: auto;
      flex: 0 0 auto;
    }
    .speaker-row {
      display: grid;
      grid-template-columns: 80px 1fr 36px 36px;
      align-items: center;
      gap: 10px;
      height: 56px;
      padding: 0 14px 0 0;
    }
    /* Stefan-2026-05-10 P15.6-r31 (R163-step2): v2 grid adds icon (start)
       and play-pause (end) columns. Name+state stack lives in a flex-col
       container so the secondary state-line sits below the title without
       breaking the single-row outer grid. */
    .speaker-row.v2 {
      grid-template-columns: 44px minmax(86px, max-content) 1fr 32px 32px 32px;
      gap: 10px;
      height: 60px;
      padding: 0 12px 0 12px;
    }
    .speaker-icon {
      justify-self: center;
      align-self: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      color: var(--secondary-text-color, #b1b3c8);
      --mdc-icon-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 200ms ease, background 160ms ease;
    }
    .speaker-row.v2.playing .speaker-icon {
      color: var(--state-light-active-color, #f88d2a);
      background: rgba(248, 141, 42, 0.18);
    }
    .speaker-name-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      overflow: hidden;
      gap: 2px;
    }
    .speaker-state {
      font-size: 11px;
      color: var(--secondary-text-color, #b1b3c8);
      text-transform: capitalize;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .speaker-row.v2 .speaker-name {
      padding-left: 0;
      font-size: 14px;
    }
    .speaker-row.v2 .speaker-btn.play-pause {
      font-size: 14px;
      /* Use the icon character itself for the visible label; same pill
         dimensions as the −/+ buttons so the button cluster reads as one
         row of identical-shape controls. */
    }
    .speaker-name {
      justify-self: start;
      align-self: center;
      padding-left: 20px;
      font-family: var(--paper-font-body1_-_font-family);
      color: var(--primary-text-color);
      font-weight: 500;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .speaker-slider {
      width: 100%;
      align-self: center;
    }
    /* Stefan-2026-05-10 R163-step1: -/+ buttons mirror the brightness-
       slider thumb - white pill, dark text, slightly squished proportions.
       Same drop-shadow as the thumb so the buttons read as the same kind
       of thing as the visible slider control. Bubble-Card sub-button
       inspiration: clean, monochrome, low-decoration. */
    .speaker-btn {
      justify-self: center;
      align-self: center;
      width: 32px;
      height: 22px;
      border-radius: 11px;
      border: none;
      background: var(--everyday-thumb-bg, #ffffff);
      color: var(--primary-text-color, #1d1f3a);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
      transition: transform 100ms ease, box-shadow 120ms ease;
    }
    .speaker-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.22);
    }
    .speaker-btn:active {
      transform: scale(0.95);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
    }
  `,e([ge({attribute:!1})],Ze.prototype,"hass",void 0),e([fe()],Ze.prototype,"config",void 0),e([ge({type:Boolean,reflect:!0})],Ze.prototype,"embedded",void 0),e([ge({type:Number,reflect:!0})],Ze.prototype,"depth",void 0),e([fe()],Ze.prototype,"_effectsActiveOrder",void 0),e([fe()],Ze.prototype,"_effectsEditMode",void 0),e([fe()],Ze.prototype,"_effectsPopupOpen",void 0),e([fe()],Ze.prototype,"_savedColorsState",void 0),e([fe()],Ze.prototype,"_displayModeSavedEditing",void 0),e([fe()],Ze.prototype,"_parallelInlineCompactRuntime",void 0),Ze=e([pe("everyday-light-card")],Ze);let et=class extends ce{constructor(){super(...arguments),this._computeLabel=e=>({entity:"Entity",name:"Name override",icon:"Icon override",default_view_mode:"View mode",group_layout:"Group layout",manual_members:"Manual member entities (order = order-of-addition)",expand_in_place:"Fixed card size (stay same height when expanding)",expansion_sticky:"Remember expansion state (sticky, requires manual collapse)",parallel_modes:"Parallel slider modes (when view = parallel)",parallel_full_length:"Parallel sliders use full length",slider_orientation:"Slider orientation",slider_style:"Slider style",slider_height:"Slider height (px, 0 = default 270)",effects_in_picker:"Show effects in mode-picker (long-press radial menu)",double_tap_action:"Double-tap action"}[e.name]??e.name)}setConfig(e){this._config=e}_flatData(){if(!this._config)return{};const e=this._config.parallel_sliders,t=this._config.slider,i=this._config.group,o=this._config.effects_picker,s=this._config.gestures?.member_icon?.double_tap??this._config.gestures?.group_icon?.double_tap??"";return{entity:this._config.entity??"",name:this._config.name??"",icon:this._config.icon??"",default_view_mode:this._config.default_view_mode??"",group_layout:i?.layout??"",manual_members:i?.manual_members??[],expand_in_place:!0===i?.expand_in_place,expansion_sticky:!0===i?.expansion_sticky,parallel_modes:e?.modes??[],parallel_full_length:!0===e?.full_length,slider_orientation:t?.orientation??"",slider_style:t?.style??"",slider_height:t?.height??0,effects_in_picker:!0===o?.in_picker,double_tap_action:s}}_schema(){return[{name:"entity",required:!0,selector:{entity:{domain:["light","media_player"]}}},{name:"name",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"display_section",type:"expandable",title:"Display",expanded:!0,flatten:!0,schema:[{name:"default_view_mode",selector:{select:{options:[{value:"",label:"Default (slider)"},{value:"parallel",label:"Parallel (multi-axis)"},{value:"color-wheel",label:"Color wheel (standalone tile)"},{value:"saved-colors",label:"Saved colors (standalone tile)"}],mode:"dropdown"}}}]},{name:"group_section",type:"expandable",title:"Group",flatten:!0,schema:[{name:"group_layout",selector:{select:{options:[{value:"",label:"Auto (expanded for groups)"},{value:"compact",label:"Compact (single tile)"},{value:"expanded",label:"Expanded (all members)"}],mode:"dropdown"}}},{name:"manual_members",selector:{entity:{multiple:!0,domain:"light"}}},{name:"expand_in_place",selector:{boolean:{}}},{name:"expansion_sticky",selector:{boolean:{}}}]},{name:"slider_section",type:"expandable",title:"Slider",flatten:!0,schema:[{name:"slider_orientation",selector:{select:{options:[{value:"",label:"Default (vertical)"},{value:"vertical",label:"Vertical"},{value:"horizontal",label:"Horizontal"}],mode:"dropdown"}}},{name:"slider_style",selector:{select:{options:[{value:"",label:"Default (pill)"},{value:"pill",label:"Pill"},{value:"mixer",label:"Mixer (speaker rows)"}],mode:"dropdown"}}},{name:"slider_height",selector:{number:{min:100,max:400,step:10,mode:"box"}}}]},{name:"parallel_section",type:"expandable",title:"Parallel sliders",flatten:!0,schema:[{name:"parallel_modes",selector:{select:{multiple:!0,options:[{value:"brightness",label:"Brightness"},{value:"temperature",label:"Temperature"},{value:"hue",label:"Hue"},{value:"saturation",label:"Saturation"}],mode:"list"}}},{name:"parallel_full_length",selector:{boolean:{}}}]},{name:"picker_section",type:"expandable",title:"Mode picker",flatten:!0,schema:[{name:"effects_in_picker",selector:{boolean:{}}}]},{name:"gestures_section",type:"expandable",title:"Gestures",flatten:!0,schema:[{name:"double_tap_action",selector:{select:{options:[{value:"",label:"Default (cycle mode)"},{value:"none",label:"None"},{value:"cycle_mode",label:"Cycle slider mode"},{value:"color_wheel",label:"Open color wheel"},{value:"saved_colors",label:"Open saved colors"},{value:"effects_list",label:"Open effects list"},{value:"expand_group",label:"Expand group (mindmap)"},{value:"classic_more_info",label:"HA more-info dialog"},{value:"toggle",label:"Toggle entity"}],mode:"dropdown"}}}]}]}_valueChanged(e){if(!this._config)return;const t=e.detail.value,i={...this._config,type:this._config.type??"custom:everyday-light-card",entity:t.entity||this._config.entity};t.name?i.name=t.name:delete i.name,t.icon?i.icon=t.icon:delete i.icon,t.default_view_mode?i.default_view_mode=t.default_view_mode:delete i.default_view_mode;const o=t.group_layout,s=t.manual_members,r=t.expand_in_place,a=t.expansion_sticky;o||s&&s.length>0||r||a?(i.group={...this._config.group},o?i.group.layout=o:delete i.group.layout,s&&s.length>0?i.group.manual_members=s:delete i.group.manual_members,r?i.group.expand_in_place=!0:delete i.group.expand_in_place,a?i.group.expansion_sticky=!0:delete i.group.expansion_sticky,0===Object.keys(i.group).length&&delete i.group):delete i.group;const n=t.parallel_modes,l=t.parallel_full_length;n&&n.length>0||l?(i.parallel_sliders={...this._config.parallel_sliders},n&&n.length>0?i.parallel_sliders.modes=n:delete i.parallel_sliders.modes,l?i.parallel_sliders.full_length=!0:delete i.parallel_sliders.full_length,0===Object.keys(i.parallel_sliders).length&&delete i.parallel_sliders):delete i.parallel_sliders;const d=t.slider_orientation,c=t.slider_style,h=t.slider_height;d||c||h&&h>0?(i.slider={...this._config.slider},d?i.slider.orientation=d:delete i.slider.orientation,c?i.slider.style=c:delete i.slider.style,h&&h>0?i.slider.height=h:delete i.slider.height,0===Object.keys(i.slider).length&&delete i.slider):delete i.slider;const p=t.effects_in_picker;p||this._config.effects_picker?(i.effects_picker={...this._config.effects_picker},p?i.effects_picker.in_picker=!0:delete i.effects_picker.in_picker,0===Object.keys(i.effects_picker).length&&delete i.effects_picker):delete i.effects_picker;const u=t.double_tap_action;u?(i.gestures={...this._config.gestures},i.gestures.member_icon={...this._config.gestures?.member_icon,double_tap:u}):this._config.gestures&&(i.gestures={...this._config.gestures},i.gestures.member_icon?.double_tap&&(i.gestures.member_icon={...i.gestures.member_icon},delete i.gestures.member_icon.double_tap,0===Object.keys(i.gestures.member_icon).length&&delete i.gestures.member_icon),0===Object.keys(i.gestures).length&&delete i.gestures),this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this.hass&&this._config?G`
      <div class="form-wrap">
        <ha-form
          .hass=${this.hass}
          .data=${this._flatData()}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
        <p class="hint">
          For advanced options (color_wheel, saved_colors, effects_picker.source,
          gestures.long_press_ms, cycle.modes), toggle <strong>Show code editor</strong>
          in the top-right of this dialog and edit the YAML directly.
          Round-trip is preserved — switching back keeps your YAML edits.
        </p>
      </div>
    `:G`<div class="placeholder">Loading editor...</div>`}};et.styles=a`
    :host {
      display: block;
    }
    .form-wrap {
      padding: 12px 0;
    }
    .placeholder {
      padding: 16px;
      color: var(--secondary-text-color);
    }
    .hint {
      margin-top: 16px;
      padding: 12px;
      background: var(--code-editor-background-color, rgba(0, 0, 0, 0.04));
      border-left: 3px solid var(--primary-color);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--secondary-text-color);
    }
    .hint strong {
      color: var(--primary-text-color);
    }
  `,e([ge({attribute:!1})],et.prototype,"hass",void 0),e([fe()],et.prototype,"_config",void 0),et=e([pe("everyday-light-card-editor")],et);var tt=Object.freeze({__proto__:null,get EverydayLightCardEditor(){return et}});export{Ze as EverydayLightCard};
//# sourceMappingURL=everyday-light-card.js.map
