const $=id=>document.getElementById(id);
let frontData="",flapData="",composedSvg="";
const NS="http://www.w3.org/2000/svg";
function val(id){return ($(id)?.value||"").trim()}
function makePrompts(){
 const purpose=val("purposeEtc")||val("purpose")||"AI가 용도에 맞게 추천";
 const mood=val("moodEtc")||val("mood")||"AI가 용도에 맞게 추천";
 const color=val("colorEtc")||val("color")||"AI가 전체 디자인에 맞게 추천";
 const decor=val("decorEtc")||val("decor")||"AI가 전체 디자인에 맞게 추천";
 const wanted=val("wanted")||"봉투 용도와 분위기에 어울리는 이미지와 장면을 창의적으로 추천";
 const extra=val("extra")||"별도 추가 요청 없음";
 const fc=val("flapColorEtc")||val("flapColor")||"AI 추천";
 const front=`전문 그래픽 디자이너로서 봉투 앞면에 적용할 독립된 가로형 평면 디자인 이미지를 제작한다.

[디자인 조건]
봉투 용도: ${purpose}
디자인 분위기: ${mood}
주요 색상: ${color}
그림 및 장식: ${decor}
앞면에 넣고 싶은 이미지나 장면: ${wanted}
추가 요청: ${extra}

[이미지 규격]
최종 적용 영역: 가로 185mm × 세로 75mm
가로세로 비율: 2.47:1
권장 캔버스: 1850 × 750px

[제작 규칙]
가로형 캔버스 전체를 디자인 영역으로 사용한다. 주요 인물·사물·문구가 잘리지 않도록 가장자리에서 충분한 안전 여백을 확보한다. 이미지 비율을 유지하고 불필요한 테두리, 봉투 외곽선, 재단선, 접는 선, 봉투 모형은 만들지 않는다. 요청하지 않은 문구나 로고를 추가하지 않는다. 사용자가 입력한 장면 설명을 바탕으로 이미지를 새롭게 구성한다. 인쇄에 적합한 선명한 고해상도 이미지 한 장만 제작한다.`;
 const flap=`전문 그래픽 디자이너로서 봉투 상단 덮개에 적용할 독립된 가로형 평면 바탕 이미지를 제작한다.

[디자인 조건]
상단 덮개 바탕색: ${fc}

[이미지 규격 및 여유 영역]
최종 적용 영역: 가로 185mm × 세로 30mm
이미지 생성 권장 크기: 가로 191mm × 세로 36mm
권장 캔버스: 1910 × 360px
최종 적용 영역보다 사방으로 약 3mm 큰 이미지로 제작한다. 웹사이트에서 중앙의 185 × 30mm 영역만 잘라 봉투에 적용한다.

[제작 규칙]
바탕은 지정한 색상의 깔끔한 단색으로만 표현한다. 문자, 글자, 숫자, 문장, 로고, 서명 등 텍스트 요소를 절대 넣지 않는다. 무늬, 패턴, 질감, 그라데이션, 그림, 장식, 테두리 및 추가 그래픽 요소도 넣지 않는다. 오직 지정된 색상의 균일한 단색 바탕만 제작한다. 봉투 외곽선, 재단선, 접는 선, 봉투 모형은 만들지 않는다. 인쇄에 적합한 선명한 고해상도 이미지 한 장만 제작한다.`;
 $("frontPrompt").textContent=front;$("flapPrompt").textContent=flap;
 $("frontPrompt").classList.remove("placeholder");$("flapPrompt").classList.remove("placeholder");
 $("promptState").textContent="생성 완료";$("copyAll").disabled=false;$("to2from1").disabled=false;
}
function copyText(text){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>alert("복사했습니다." )).catch(()=>fallbackCopy(text))}else fallbackCopy(text)}
function fallbackCopy(text){const t=document.createElement("textarea");t.value=text;document.body.append(t);t.select();document.execCommand("copy");t.remove();alert("복사했습니다.")}
function dataUrl(file,cb){if(!file)return; if(!file.type.startsWith("image/")){alert("이미지 파일을 선택해 주세요.");return}const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
function loadImage(kind,data){if(kind==="front"){frontData=data;$("frontThumb").src=data;$("frontThumb").style.display="block";$("frontEmpty").style.display="none"}else{flapData=data;$("flapThumb").src=data;$("flapThumb").style.display="block";$("flapEmpty").style.display="none"}localStorage.setItem("env_"+kind,data);compose()}
function controls(kind){return {fit:val(kind+"Fit"),zoom:Number(val(kind+"Zoom"))/100,x:Number(val(kind+"X")),y:Number(val(kind+"Y"))}}
function imageMarkup(data,imgX,imgY,imgW,imgH,clipX,clipY,clipW,clipH,c,rotate=false){
 if(!data)return "";
 const tx=c.x/100*clipW*.45,ty=c.y/100*clipH*.45;
 const cx=clipX+clipW/2,cy=clipY+clipH/2;
 const transform=`translate(${cx+tx} ${cy+ty}) scale(${c.zoom}) translate(${-cx} ${-cy})`;
 const par=c.fit==="cover"?"xMidYMid slice":"xMidYMid meet";
 const img=`<image href="${data}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="${par}" transform="${transform}"/>`;
 // Use a nested SVG viewport as a hard clipping boundary. This does not rely
 // on clipPath URL resolution and remains fixed when the flap artwork rotates.
 const content=rotate?`<g transform="rotate(180 ${clipX+clipW/2} ${clipY+clipH/2})">${img}</g>`:img;
 return `<svg x="${clipX}" y="${clipY}" width="${clipW}" height="${clipH}" viewBox="${clipX} ${clipY} ${clipW} ${clipH}" preserveAspectRatio="none" overflow="hidden">${content}</svg>`;
}
function dielineMarkup(){
 // Exact outer cut contour and fold lines from the user's uploaded envelope-template.svg.
 return `<g fill="none" stroke="#657487" stroke-width=".25" stroke-linejoin="round">
 <path d="M20 0H205V30H225V105H205L196 170H29L20 105H0V30H20Z"/>
 </g>
 <g fill="none" stroke="#9aa6b4" stroke-width=".22" stroke-dasharray="1.5 1.2">
 <path d="M20 30H205M20 105H205M20 30V105M205 30V105"/>
 </g>`;
}
function buildSvg(a4=false){
 const f=controls("front"),fl=controls("flap");
 const front=imageMarkup(frontData,20,30,185,75,20,30,185,75,f,false);
 // The flap image is generated with 3mm bleed on every side (191 × 36mm),
 // then displayed through a separate 185 × 30mm nested SVG viewport.
 const flap=imageMarkup(flapData,17,-3,191,36,20,0,185,30,fl,true);
 const inner=`<rect x="0" y="0" width="225" height="170" fill="#fff"/>
 ${flap}${front}
 ${dielineMarkup()}`;
 if(a4){
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="297mm" height="210mm" viewBox="0 0 297 210">
  <rect width="297" height="210" fill="#fff"/>
  <svg x="36" y="20" width="225" height="170" viewBox="0 0 225 170">${inner}</svg>
  </svg>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="225mm" height="170mm" viewBox="0 0 225 170">${inner}</svg>`;
}
function compose(){
 composedSvg=buildSvg(false);$("envelopePreview").innerHTML=composedSvg;
 $("composeState").textContent=frontData&&flapData?"합성 미리보기":"이미지 확인 필요";
 $("to3").disabled=!(frontData&&flapData);
}
function showScreen(n){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 $("screen"+n).classList.add("active");
 document.querySelectorAll(".steps .step").forEach(s=>{const k=Number(s.dataset.step);s.classList.toggle("active",k===n);s.classList.toggle("done",k<n)});
 if(n===3){$("finalPreview").innerHTML=buildSvg(true)}
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".color-palette").forEach(palette=>{
 const target=palette.dataset.target;
 palette.querySelectorAll(".swatch-choice").forEach(button=>button.addEventListener("click",()=>{
  $(target).value=button.dataset.value;
  palette.querySelectorAll(".swatch-choice").forEach(item=>{const selected=item===button;item.classList.toggle("selected",selected);item.setAttribute("aria-pressed",String(selected));});
  const custom=target==="color"?"colorEtc":"flapColorEtc";$(custom).value="";
 }));
});
$("makePrompt").onclick=makePrompts;
document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>copyText($(b.dataset.copy).textContent));
$("copyAll").onclick=()=>copyText("앞면 디자인\n"+$("frontPrompt").textContent+"\n\n상단 덮개 디자인\n"+$("flapPrompt").textContent);
$("to2from1").onclick=()=>showScreen(2);$("back1").onclick=()=>showScreen(1);
$("frontFile").onchange=e=>dataUrl(e.target.files[0],d=>loadImage("front",d));
$("flapFile").onchange=e=>dataUrl(e.target.files[0],d=>loadImage("flap",d));
["frontFit","frontZoom","frontX","frontY","flapFit","flapZoom","flapX","flapY"].forEach(id=>$(id).addEventListener("input",()=>{const o=$(id+"Val");if(o)o.textContent=id.toLowerCase().includes("zoom")?$(id).value+"%":$(id).value;compose()}));
function reset(kind){$(kind+"Fit").value=kind==="flap"?"cover":"contain";$(kind+"Zoom").value=100;$(kind+"X").value=0;$(kind+"Y").value=0;["Zoom","X","Y"].forEach(s=>{const o=$(kind+s+"Val");if(o)o.textContent=s==="Zoom"?"100%":"0"});compose()}
$("resetFront").onclick=()=>reset("front");$("resetFlap").onclick=()=>reset("flap");
$("compose").onclick=()=>{if(!frontData||!flapData){alert("앞면과 상단 덮개 이미지를 모두 업로드해 주세요.");return}compose();alert("봉투 합성이 완료되었습니다.")};
$("to3").onclick=()=>showScreen(3);$("back2").onclick=()=>showScreen(2);
function printPage(){if(!composedSvg){alert("먼저 이미지를 업로드하고 합성해 주세요.");return}showScreen(3);setTimeout(()=>window.print(),250)}
$("printNow").onclick=printPage;$("downloadPdf").onclick=printPage;
$("restart").onclick=()=>{if(!confirm("현재 작업을 초기화하고 새 봉투를 만들까요?"))return;localStorage.removeItem("env_front");localStorage.removeItem("env_flap");frontData=flapData="";location.reload()};
$("to2from1").disabled=true;$("copyAll").disabled=true;$("to3").disabled=true;
try{const f=localStorage.getItem("env_front"),fl=localStorage.getItem("env_flap");if(f)loadImage("front",f);if(fl)loadImage("flap",fl)}catch(e){console.warn("저장된 이미지 복원 실패",e)}
compose();
