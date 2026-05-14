const n=[];function c(e){n.push(e)}function l(){let e;for(;e=n.pop();)try{e()}catch(a){console.warn("[pageLifecycle] cleanup error:",a)}}export{l as f,c as r};
