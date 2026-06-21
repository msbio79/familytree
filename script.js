/**
 * 고등학교 생명과학 가계도 시뮬레이션 프로그램 - script.js
 */

// --- 1. 애플리케이션 상태 (State) ---
const state = {
  // 노드(인물) 리스트
  nodes: [],
  // 부부 연결 리스트
  marriages: [],
  
  // 현재 선택된 객체 ID
  selectedNodeId: null,
  selectedMarriageId: null,
  
  // 캔버스 카메라 변환 상태 (Pan & Zoom)
  panX: 100,
  panY: 50,
  scale: 1.0,
  
  // 편집 모드: 'select' (선택/이동), 'marry' (부부 연결)
  mode: 'select',
  
  // 테마: 'dark' | 'light'
  theme: 'dark',
  
  // 유전학적 설정
  settings: {
    inheritanceMode: 'standard', // 'standard' 또는 'abo'
    traitCount: 1,         // 형질 개수 (1 또는 2)
    chromosome: 'autosomal', // 염색체 종류 ('autosomal' 상, 'sex_linked' 성)
    notation: 'prime',      // 성염색체 표기법 ('prime' X/X', 'superscript' X^A/X^a)
    linkage: 'independent',  // 연관 관계 ('independent' 독립, 'coupling' 상인, 'repulsion' 상반)
    showGenotype: true,     // 유전자형 캔버스 노출 여부
    trait1Dom: 'A',         // 첫 번째 형질 우성 문자
    trait1Rec: 'a',         // 첫 번째 형질 열성 문자
    trait2Dom: 'B',         // 두 번째 형질 우성 문자
    trait2Rec: 'b'          // 두 번째 형질 열성 문자
  },
  

  
  // 드래그 제어용 임시 변수
  draggedNode: null,
  dragOffset: { x: 0, y: 0 },
  isPanning: false,
  panStart: { x: 0, y: 0 },
  nodeDragStarted: false,
  
  // 부부 연결 시 첫 번째 선택 노드
  marryFirstNodeId: null,
  
  // 터치 제스처용 캐시
  drawSettings: {
    color: '#ef4444',
    width: 3,
    tool: 'pen' // 'pen' or 'eraser'
  },
  currentPath: null,
  isErasing: false,
  
  // 상태 백업/되돌리기용 (향후 기능)
  pointerCache: [],
  prevDiff: -1,
  prevPinchCenter: null,
  
  // 빈칸 플레이스홀더 제어
  activePlaceholderTargetId: null
};

// --- 2. HTML 엘리먼트 참조 ---
const el = {
  sidebar: document.getElementById('sidebar'),
  sidebarCollapseBtn: document.getElementById('sidebar-collapse-btn'),
  sidebarToggleFloating: document.getElementById('sidebar-toggle-floating'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  iconSun: document.querySelector('.icon-sun'),
  iconMoon: document.querySelector('.icon-moon'),
  
  // 설정 컨트롤
  inheritanceModeSelect: document.getElementById('inheritance-mode-select'),
  traitCountSelect: document.getElementById('trait-count-select'),
  chromosomeSelect: document.getElementById('chromosome-select'),
  notationRow: document.getElementById('notation-row'),
  notationSelect: document.getElementById('notation-select'),
  linkageRow: document.getElementById('linkage-row'),
  linkageSelect: document.getElementById('linkage-select'),
  showGenotypeToggle: document.getElementById('show-genotype-toggle'),
  trait1LetterRow: document.getElementById('trait1-letter-row'),
  trait1DomInput: document.getElementById('trait1-dom-input'),
  trait1RecInput: document.getElementById('trait1-rec-input'),
  trait2LetterRow: document.getElementById('trait2-letter-row'),
  trait2DomInput: document.getElementById('trait2-dom-input'),
  trait2RecInput: document.getElementById('trait2-rec-input'),
  
  // 모두 지우기 버튼
  btnClearAll: document.getElementById('btn-clear-all'),
  
  // 모드 버튼
  modeSelect: document.getElementById('mode-select'),
  modeMarry: document.getElementById('mode-marry'),
  modeDraw: document.getElementById('mode-draw'),
  
  // 필기 모드 툴바
  drawToolbar: document.getElementById('draw-toolbar'),
  drawColor: document.getElementById('draw-color'),
  drawWidth: document.getElementById('draw-width'),
  drawPenBtn: document.getElementById('draw-pen-btn'),
  drawEraserBtn: document.getElementById('draw-eraser-btn'),
  drawClearBtn: document.getElementById('draw-clear-btn'),
  drawExitBtn: document.getElementById('draw-exit-btn'),
  drawLayer: document.getElementById('draw-layer'),
  
  // 노드 추가 버튼
  addMaleBtn: document.getElementById('add-male-btn'),
  addFemaleBtn: document.getElementById('add-female-btn'),
  addCoupleBtn: document.getElementById('add-couple-btn'),
  
  // 상세 설정 패널
  detailPanel: document.getElementById('detail-panel'),
  detailCloseBtn: document.getElementById('detail-close-btn'),
  nodeNameInput: document.getElementById('node-name-input'),
  nodeGenderSelect: document.getElementById('node-gender-select'),
  bloodTypeRow: document.getElementById('blood-type-row'),
  nodeBloodTypeSelect: document.getElementById('node-blood-type-select'),
  trait1Row: document.getElementById('trait1-row'),
  nodeTrait1Select: document.getElementById('node-trait1-select'),
  trait2Row: document.getElementById('trait2-row'),
  nodeTrait2Select: document.getElementById('node-trait2-select'),
  nodeGenotypeSelect: document.getElementById('node-genotype-select'),
  nodeGenotypeCustom: document.getElementById('node-genotype-custom'),
  deleteNodeBtn: document.getElementById('delete-node-btn'),
  
  // 범례 구성
  trait2Legends: document.querySelectorAll('.trait-2-legend'),
  traitBothLegends: document.querySelectorAll('.trait-both-legend'),
  
  // 캔버스 및 SVG
  canvasContainer: document.getElementById('canvas-container'),
  svg: document.getElementById('pedigree-svg'),
  viewportGroup: document.getElementById('svg-viewport-group'),
  linesGroup: document.getElementById('lines-group'),
  nodesGroup: document.getElementById('nodes-group'),
  htmlOverlayLayer: document.getElementById('html-overlay-layer'),
  deleteDropZone: document.getElementById('delete-drop-zone'),
  toast: document.getElementById('toast'),
  
  // 줌 컨트롤
  zoomInBtn: document.getElementById('zoom-in-btn'),
  zoomOutBtn: document.getElementById('zoom-out-btn'),
  zoomFitBtn: document.getElementById('zoom-fit-btn'),
  
};

// --- 3. 초기화 (Init) ---
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  applyTheme();
  fitToScreen();
});

// --- 4. 이벤트 리스너 설정 ---
function setupEventListeners() {
  // 테마 및 사이드바 토글
  el.themeToggleBtn.addEventListener('click', toggleTheme);
  el.sidebarCollapseBtn.addEventListener('click', () => toggleSidebar(true));
  el.sidebarToggleFloating.addEventListener('click', () => toggleSidebar(false));
  
  // 범례 확장/축소 및 크기 조절
  let legendScale = 1;
  const legendToggleBtn = document.getElementById('legend-toggle-btn');
  const legendSizeBtn = document.getElementById('legend-size-btn');
  const legendItemsContainer = document.getElementById('legend-items-container');
  const legendIconCollapse = document.getElementById('legend-icon-collapse');
  const legendIconExpand = document.getElementById('legend-icon-expand');
  const legendOverlay = document.getElementById('legend-overlay');

  legendToggleBtn.addEventListener('click', () => {
    const isHidden = legendItemsContainer.style.display === 'none';
    legendItemsContainer.style.display = isHidden ? 'flex' : 'none';
    legendIconCollapse.style.display = isHidden ? 'block' : 'none';
    legendIconExpand.style.display = isHidden ? 'none' : 'block';
  });

  legendSizeBtn.addEventListener('click', () => {
    if (legendScale === 1) {
      legendScale = 2;
    } else if (legendScale === 2) {
      legendScale = 0.5;
    } else {
      legendScale = 1;
    }
    // 범례 헤더 및 아이콘 크기는 유지하고 내용물만 줌 조절
    legendItemsContainer.style.zoom = legendScale;
  });
  
  // 설정 변경 시 UI 표시 여부를 결정하는 헬퍼 함수
  function updateSettingsVisibility() {
    // 1형질에서는 mixed(복합) 염색체 선택 불가
    if (state.settings.traitCount === 1) {
      if (state.settings.chromosome === 'mixed') {
        el.chromosomeSelect.value = 'autosomal';
        state.settings.chromosome = 'autosomal';
      }
      Array.from(el.chromosomeSelect.options).forEach(opt => {
        opt.disabled = (opt.value === 'mixed');
        opt.style.display = '';
      });
    } else {
      Array.from(el.chromosomeSelect.options).forEach(opt => {
        opt.disabled = false;
        opt.style.display = '';
      });
    }

    if (state.settings.inheritanceMode === 'abo') {
      el.traitCountSelect.options[0].textContent = "1개 형질 (ABO식 혈액형)";
      el.traitCountSelect.options[1].textContent = "2개 형질 (ABO식 혈액형, H/h)";
      
      if (state.settings.trait2Dom !== 'H' || state.settings.trait2Rec !== 'h') {
        state.settings.trait2Dom = 'H';
        state.settings.trait2Rec = 'h';
        el.trait2DomInput.value = 'H';
        el.trait2RecInput.value = 'h';
      }
      
      el.trait1LetterRow.style.display = 'none';
      el.linkageRow.style.display = 'none'; // ABO 연관유전은 지원 제외
      if (state.settings.traitCount === 1) {
        el.chromosomeSelect.disabled = true;
        el.chromosomeSelect.value = 'autosomal';
        state.settings.chromosome = 'autosomal';
      } else {
        el.chromosomeSelect.disabled = false;
        // 2개 형질일 때 ABO는 1형질이 무조건 상염색체이므로 'sex_linked' 단독 선택 불가
        if (state.settings.chromosome === 'sex_linked') {
          el.chromosomeSelect.value = 'autosomal';
          state.settings.chromosome = 'autosomal';
        }
        Array.from(el.chromosomeSelect.options).forEach(opt => {
          if (opt.value === 'sex_linked') {
            opt.disabled = true;
            opt.style.display = 'none';
          }
        });
      }
      el.notationRow.style.display = 'none'; // ABO 2형질 성염색체/복합은 무조건 윗첨자 사용
    } else {
      el.traitCountSelect.options[0].textContent = "1개 형질 (A/a)";
      el.traitCountSelect.options[1].textContent = "2개 형질 (A/a, B/b)";
      
      el.trait1LetterRow.style.display = 'flex';
      el.chromosomeSelect.disabled = false;
      if (state.settings.chromosome === 'sex_linked') {
        el.linkageRow.style.display = 'none'; // 성염색체는 단순 단일/복합 유전으로 단순화
        if (state.settings.traitCount === 2) {
          el.notationRow.style.display = 'none'; // 2형질 성염색체는 무조건 윗첨자 사용
          if (state.settings.notation === 'prime') {
            el.notationSelect.value = 'superscript';
            el.notationSelect.dispatchEvent(new Event('change'));
          }
        } else {
          el.notationRow.style.display = 'flex';
        }
      } else if (state.settings.chromosome === 'mixed') {
        if (state.settings.traitCount === 2) {
          el.linkageRow.style.display = 'flex'; // 사용자의 요청에 따라 복합 유전에서도 연관 옵션 표시
        } else {
          el.linkageRow.style.display = 'none';
        }
        el.notationRow.style.display = 'none'; // 무조건 윗첨자 사용
        if (state.settings.notation === 'prime') {
          el.notationSelect.value = 'superscript';
          el.notationSelect.dispatchEvent(new Event('change'));
        }
      } else {
        // autosomal
        el.notationRow.style.display = 'none';
        if (state.settings.traitCount === 2) {
          el.linkageRow.style.display = 'flex';
        } else {
          el.linkageRow.style.display = 'none';
        }
      }
    }
  }

  // 전역 유전 설정 변경
  el.inheritanceModeSelect.addEventListener('change', (e) => {
    state.settings.inheritanceMode = e.target.value;
    updateLegendVisibility();
    updateSettingsVisibility();
    updateDetailPanelGenotypes();
    render();
  });
  el.traitCountSelect.addEventListener('change', (e) => {
    state.settings.traitCount = parseInt(e.target.value);
    toggleTrait2UI();
    updateLegendVisibility();
    updateSettingsVisibility();
    updateDetailPanelGenotypes();
    render();
  });
  el.chromosomeSelect.addEventListener('change', (e) => {
    state.settings.chromosome = e.target.value;
    updateSettingsVisibility();
    updateDetailPanelGenotypes();
    render();
  });
  el.notationSelect.addEventListener('change', (e) => {
    const oldNotation = state.settings.notation;
    const newNotation = e.target.value;
    state.settings.notation = newNotation;
    
    // 기존에 입력된 유전자형 일괄 변환 (시각적 업데이트)
    if (oldNotation !== newNotation && state.settings.chromosome === 'sex_linked' && state.settings.traitCount === 1) {
      const L1_D = state.settings.trait1Dom || 'A';
      const L1_R = state.settings.trait1Rec || 'a';
      const superscriptMap = {'A':'ᴬ', 'B':'ᴮ', 'C':'ᶜ', 'D':'ᴰ', 'E':'ᴱ', 'F':'ᶠ', 'G':'ᴳ', 'H':'ᴴ', 'I':'ᴵ', 'J':'ᶠ', 'K':'ᴷ', 'L':'ᴸ', 'M':'ᴹ', 'N':'ᴺ', 'O':'ᴼ', 'P':'ᴾ', 'Q':'Q', 'R':'ᴿ', 'S':'ˢ', 'T':'ᵀ', 'U':'ᵁ', 'V':'ⱽ', 'W':'ᵂ', 'X':'ˣ', 'Y':'ʸ', 'Z':'ᶻ', 'a':'ᵃ', 'b':'ᵇ', 'c':'ᶜ', 'd':'ᵈ', 'e':'ᵉ', 'f':'ᶠ', 'g':'ᵍ', 'h':'ʰ', 'i':'ⁱ', 'j':'ʲ', 'k':'ᵏ', 'l':'ˡ', 'm':'ᵐ', 'n':'ⁿ', 'o':'ᵒ', 'p':'ᵖ', 'q':'q', 'r':'ʳ', 's':'ˢ', 't':'ᵗ', 'u':'ᵘ', 'v':'ᵛ', 'w':'ʷ', 'x':'ˣ', 'y':'ʸ', 'z':'ᶻ', '*':'*'};
      
      const getSup = (str) => {
        return str.split('').map(c => superscriptMap[c] || '^' + c).join('');
      };
      
      const S1_D = getSup(L1_D);
      const S1_R = getSup(L1_R);

      state.nodes.forEach(n => {
        if (!n.genotype) return;
        if (newNotation === 'prime') {
          // superscript -> prime
          n.genotype = n.genotype.split(`X${S1_D}`).join("X").split(`X${S1_R}`).join("X'");
        } else {
          // prime -> superscript
          n.genotype = n.genotype.split("X'").join(`X${S1_R}`).split("X").join(`X${S1_D}`);
        }
      });
    }
    
    updateDetailPanelGenotypes();
    
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        el.nodeGenotypeSelect.value = node.genotype;
        el.nodeGenotypeCustom.value = node.genotype;
      }
    }
    
    render();
  });
  el.linkageSelect.addEventListener('change', (e) => {
    state.settings.linkage = e.target.value;
    updateDetailPanelGenotypes();
    render();
  });
  el.showGenotypeToggle.addEventListener('change', (e) => {
    state.settings.showGenotype = e.target.checked;
    render();
  });

  const updateLetter = (field, e) => {
    const oldL = state.settings[field];
    const newL = e.target.value.trim();
    if (oldL === newL || newL === '') return;
    
    // We update L1_D, L1_R, L2_D, L2_R depending on the field
    const oldL1_D = state.settings.trait1Dom;
    const oldL1_R = state.settings.trait1Rec;
    const oldL2_D = state.settings.trait2Dom;
    const oldL2_R = state.settings.trait2Rec;

    state.settings[field] = newL;
    
    const newL1_D = state.settings.trait1Dom;
    const newL1_R = state.settings.trait1Rec;
    const newL2_D = state.settings.trait2Dom;
    const newL2_R = state.settings.trait2Rec;

    const superscriptMap = {'A':'ᴬ', 'B':'ᴮ', 'C':'ᶜ', 'D':'ᴰ', 'E':'ᴱ', 'F':'ᶠ', 'G':'ᴳ', 'H':'ᴴ', 'I':'ᴵ', 'J':'ᴶ', 'K':'ᴷ', 'L':'ᴸ', 'M':'ᴹ', 'N':'ᴺ', 'O':'ᴼ', 'P':'ᴾ', 'Q':'Q', 'R':'ᴿ', 'S':'ˢ', 'T':'ᵀ', 'U':'ᵁ', 'V':'ⱽ', 'W':'ᵂ', 'X':'ˣ', 'Y':'ʸ', 'Z':'ᶻ', 'a':'ᵃ', 'b':'ᵇ', 'c':'ᶜ', 'd':'ᵈ', 'e':'ᵉ', 'f':'ᶠ', 'g':'ᵍ', 'h':'ʰ', 'i':'ⁱ', 'j':'ʲ', 'k':'ᵏ', 'l':'ˡ', 'm':'ᵐ', 'n':'ⁿ', 'o':'ᵒ', 'p':'ᵖ', 'q':'q', 'r':'ʳ', 's':'ˢ', 't':'ᵗ', 'u':'ᵘ', 'v':'ᵛ', 'w':'ʷ', 'x':'ˣ', 'y':'ʸ', 'z':'ᶻ', '*':'*'};
    
    const getSup = (str) => {
      return str.split('').map(c => superscriptMap[c] || '^' + c).join('');
    };
    
    const oldS1_D = getSup(oldL1_D);
    const oldS1_R = getSup(oldL1_R);
    const oldS2_D = getSup(oldL2_D);
    const oldS2_R = getSup(oldL2_R);

    const newS1_D = getSup(newL1_D);
    const newS1_R = getSup(newL1_R);
    const newS2_D = getSup(newL2_D);
    const newS2_R = getSup(newL2_R);
    
    state.nodes.forEach(n => {
      if (n.genotype) {
        let g = n.genotype;
        
        // Only replace if the field matches what was changed.
        // It's safer to just replace the specific oldL with newL.
        // Wait, for superscript, we need to replace oldSup with newSup.
        // But what if oldL is 'A' and another letter is 'a', it could overlap.
        // For simplicity, we just replace the specific letter that changed.
        
        const oldS = getSup(oldL);
        const newS = getSup(newL);
        
        // Normal replacement
        g = g.split(oldS).join('__TEMP_SUP__');
        g = g.split(oldL).join('__TEMP__');
        
        g = g.split('__TEMP_SUP__').join(newS);
        g = g.split('__TEMP__').join(newL);
        
        n.genotype = g;
      }
    });
    
    updateDetailPanelGenotypes();
    
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) el.nodeGenotypeSelect.value = node.genotype;
    }
    render();
  };

  el.trait1DomInput.addEventListener('change', (e) => updateLetter('trait1Dom', e));
  el.trait1RecInput.addEventListener('change', (e) => updateLetter('trait1Rec', e));
  el.trait2DomInput.addEventListener('change', (e) => updateLetter('trait2Dom', e));
  el.trait2RecInput.addEventListener('change', (e) => updateLetter('trait2Rec', e));
  
  // 전체 지우기 버튼
  el.btnClearAll.addEventListener('click', clearAll);
  
  // 모드 변경 버튼
  el.modeSelect.addEventListener('click', () => setMode('select'));
  el.modeMarry.addEventListener('click', () => setMode('marry'));
  el.modeDraw.addEventListener('click', () => setMode('draw'));
  
  // 필기 모드 설정
  el.drawColor.addEventListener('input', (e) => state.drawSettings.color = e.target.value);
  el.drawWidth.addEventListener('input', (e) => state.drawSettings.width = parseInt(e.target.value));
  
  el.drawPenBtn.addEventListener('click', () => {
    state.drawSettings.tool = 'pen';
    el.drawPenBtn.classList.add('active');
    el.drawEraserBtn.classList.remove('active');
  });
  
  el.drawEraserBtn.addEventListener('click', () => {
    state.drawSettings.tool = 'eraser';
    el.drawEraserBtn.classList.add('active');
    el.drawPenBtn.classList.remove('active');
  });
  
  el.drawClearBtn.addEventListener('click', () => {
    el.drawLayer.innerHTML = '';
  });
  
  el.drawExitBtn.addEventListener('click', () => {
    setMode('select');
    if (el.sidebar.classList.contains('collapsed')) {
      toggleSidebar(false); // 사이드바 다시 펼치기
    }
  });
  
  // 개체 직접 추가 버튼
  el.addMaleBtn.addEventListener('click', () => addIndividual('M'));
  el.addFemaleBtn.addEventListener('click', () => addIndividual('F'));
  el.addCoupleBtn.addEventListener('click', addCouple);
  
  // 상세 설정 패널 동작
  el.detailCloseBtn.addEventListener('click', deselectAll);
  
  el.nodeNameInput.addEventListener('input', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.name = e.target.value;
        render();
      }
    }
  });
  
  el.nodeGenderSelect.addEventListener('change', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.gender = e.target.value;
        updateDetailPanelGenotypes();
        render();
      }
    }
  });
  
  el.nodeBloodTypeSelect.addEventListener('change', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.bloodType = e.target.value;
        render();
      }
    }
  });
  
  el.nodeTrait1Select.addEventListener('change', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.trait1 = e.target.value;
        render();
      }
    }
  });
  
  el.nodeTrait2Select.addEventListener('change', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.trait2 = e.target.value;
        render();
      }
    }
  });
  
  el.nodeGenotypeSelect.addEventListener('change', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.genotype = e.target.value === '-- 선택 --' ? '' : e.target.value;
        el.nodeGenotypeCustom.value = node.genotype;
        render();
      }
    }
  });
  
  el.nodeGenotypeCustom.addEventListener('input', (e) => {
    if (state.selectedNodeId) {
      const node = findNode(state.selectedNodeId);
      if (node) {
        node.genotype = e.target.value;
        render();
      }
    }
  });
  
  el.deleteNodeBtn.addEventListener('click', deleteSelected);
  
  // 줌 버튼 동작
  el.zoomInBtn.addEventListener('click', () => zoom(1.2));
  el.zoomOutBtn.addEventListener('click', () => zoom(0.8));
  el.zoomFitBtn.addEventListener('click', fitToScreen);
  
  // SVG 마우스/터치 드래그 팬(Pan) 및 줌
  el.svg.addEventListener('pointerdown', onPointerDown, { passive: false });
  el.svg.addEventListener('pointermove', onPointerMove, { passive: false });
  el.svg.addEventListener('pointerup', onPointerUp, { passive: false });
  el.svg.addEventListener('pointercancel', onPointerUp, { passive: false });
  el.svg.addEventListener('wheel', onWheel, { passive: false });
  
  // 윈도우 레벨에서 포인터 해제/취소를 추가 감시하여 좀비 포인터 누적 방지
  const cleanPointerFromCache = (e) => {
    const index = state.pointerCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) {
      state.pointerCache.splice(index, 1);
    }
    if (state.pointerCache.length < 2) {
      state.prevDiff = -1;
    }
  };
  window.addEventListener('pointerup', cleanPointerFromCache);
  window.addEventListener('pointercancel', cleanPointerFromCache);
  
  // 터치 기기용 실제 터치 상태 강제 동기화 (아이패드 등 터치 꼬임 해결의 핵심)
  window.addEventListener('touchstart', syncPointerCacheWithTouches, { passive: true });
  window.addEventListener('touchmove', syncPointerCacheWithTouches, { passive: true });
  window.addEventListener('touchend', syncPointerCacheWithTouches, { passive: true });
  window.addEventListener('touchcancel', syncPointerCacheWithTouches, { passive: true });
  
  // 범례 클릭 이벤트 바인딩
  document.querySelectorAll('.legend-draggable').forEach(item => {
    item.addEventListener('click', onLegendClick);
  });
}

// --- 5. 테마 변경 (Dark / Light) ---
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

function applyTheme() {
  document.body.setAttribute('data-theme', state.theme);
  if (state.theme === 'dark') {
    el.iconSun.style.display = 'block';
    el.iconMoon.style.display = 'none';
  } else {
    el.iconSun.style.display = 'none';
    el.iconMoon.style.display = 'block';
  }
}

// --- 6. 사이드바 접기/펼치기 ---
function toggleSidebar(collapsed) {
  if (collapsed) {
    el.sidebar.classList.add('collapsed');
    el.sidebarToggleFloating.classList.add('visible');
  } else {
    el.sidebar.classList.remove('collapsed');
    el.sidebarToggleFloating.classList.remove('visible');
  }
  // 사이드바 변경에 따른 캔버스 크기 조정
  setTimeout(fitToScreen, 200);
}

// --- 7. 형질 UI 토글 ---
function toggleTrait2UI() {
  if (state.settings.traitCount === 2) {
    el.trait2Row.style.display = 'flex';
    el.trait2LetterRow.style.display = 'flex';
    if (state.settings.chromosome === 'autosomal') {
      el.linkageRow.style.display = 'flex';
    }
  } else {
    el.trait2Row.style.display = 'none';
    el.trait2LetterRow.style.display = 'none';
    el.linkageRow.style.display = 'none';
  }
}

function updateLegendVisibility() {
  // 형질2/복합형질 범례는 이제 항상 표시됩니다.
}

// --- 8. 작동 모드 설정 ---
function setMode(newMode) {
  state.mode = newMode;
  el.modeSelect.classList.toggle('active', newMode === 'select');
  el.modeMarry.classList.toggle('active', newMode === 'marry');
  el.modeDraw.classList.toggle('active', newMode === 'draw');
  
  el.drawToolbar.style.display = newMode === 'draw' ? 'flex' : 'none';
  
  if (newMode === 'draw') {
    // 필기 모드 진입 시 사이드바를 자동으로 접음
    if (!el.sidebar.classList.contains('collapsed')) {
      toggleSidebar(true);
    }
  }
  
  state.marryFirstNodeId = null;
  state.draggedNode = null;
  state.isPanning = false;
  state.currentPath = null;
  state.isErasing = false;
  
  if (newMode !== 'select') {
    deselectAll();
  }
  
  // Show toast for mode change
  if (newMode === 'select') {
    showToast("선택 및 드래그 모드로 변경되었습니다.");
  } else if (newMode === 'marry') {
    showToast("부부 연결 모드로 변경되었습니다. 남자와 여자를 터치하세요.");
  } else if (newMode === 'draw') {
    showToast("필기 모드로 변경되었습니다. 캔버스에 설명 및 필기를 할 수 있습니다.");
  }
  
  render();
}

// --- 9. 드래그 / 캔버스 카메라 제어 (Pointer Events) ---

// 지우개 로직
function eraseAtPointer(x, y) {
  const elems = document.elementsFromPoint(x, y);
  for (let elem of elems) {
    if (elem.tagName.toLowerCase() === 'path' && elem.parentElement === el.drawLayer) {
      elem.remove();
      break;
    }
  }
}

function onPointerDown(e) {
  const target = e.target;
  // 유전자형 select 클릭 시 드래그 및 이벤트 막기
  if (target.tagName.toLowerCase() === 'select' || target.tagName.toLowerCase() === 'option' || target.closest('foreignObject')) {
    return;
  }
  
  // 필기 모드일 때는 잦은 획 그리기로 인한 포인터 캡처 오버헤드를 막기 위해 캡처 제외
  if (state.mode !== 'draw') {
    try {
      el.svg.setPointerCapture(e.pointerId);
    } catch(err) {}
  }
  
  // 마우스인 경우 캐시 강제 초기화하여 좀비 터치 방지
  if (e.pointerType === 'mouse') {
    state.pointerCache = [e];
  } else {
    // 멀티터치를 위해 포인터 등록 (중복 방지)
    const existingIndex = state.pointerCache.findIndex(p => p.pointerId === e.pointerId);
    if (existingIndex !== -1) {
      state.pointerCache[existingIndex] = e;
    } else {
      state.pointerCache.push(e);
    }
  }
  
  // closest를 사용하여 텍스트나 빗금 오버레이 클릭 시에도 정상 그룹 데이터 매칭되도록 보완
  const nodeGroup = target.closest('.pedigree-node');
  const nodeId = nodeGroup ? nodeGroup.getAttribute('data-node-id') : null;
  
  const marriageGroup = target.closest('.marriage-node');
  const marriageId = marriageGroup ? marriageGroup.getAttribute('data-marriage-id') : null;
  
  const connectionLine = target.closest('.pedigree-connection-line');
  const familyMarriageId = connectionLine ? connectionLine.getAttribute('data-family-marriage-id') : null;
  
  if (state.pointerCache.length === 1) {
    // 단일 터치/클릭
    if (state.mode === 'draw') {
      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      if (state.drawSettings.tool === 'pen') {
        state.currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        state.currentPath.setAttribute('fill', 'none');
        state.currentPath.setAttribute('stroke', state.drawSettings.color);
        state.currentPath.setAttribute('stroke-width', state.drawSettings.width);
        state.currentPath.setAttribute('stroke-linecap', 'round');
        state.currentPath.setAttribute('stroke-linejoin', 'round');
        state.currentPath.setAttribute('d', `M ${canvasCoords.x} ${canvasCoords.y}`);
        // 설정하여 지우개 작동 시 이벤트를 받을 수 있도록 함
        state.currentPath.setAttribute('pointer-events', 'stroke');
        el.drawLayer.appendChild(state.currentPath);
        
        e.preventDefault();
        return;
      } else if (state.drawSettings.tool === 'eraser') {
        state.isErasing = true;
        eraseAtPointer(e.clientX, e.clientY);
        e.preventDefault();
        return;
      }
    }
    
    if (nodeId) {
      const now = Date.now();
      if (state.mode === 'select' && state.lastClickedNodeId === nodeId && now - (state.lastNodeClickTime || 0) < 300) {
        state.selectedNodeId = nodeId;
        deleteSelected();
        state.lastClickedNodeId = null;
        return;
      }
      state.lastClickedNodeId = nodeId;
      state.lastNodeClickTime = now;
      
      const node = findNode(nodeId);
      if (node && node.isPlaceholder) {
        // 플레이스홀더 빈칸은 드래그할 수 없고 클릭해서 정보 보기만 지원
        if (state.mode === 'select') {
          state.selectedNodeId = nodeId;
          state.selectedMarriageId = null;
          showDetailPanel(node);
          render();
        }
        return;
      }
      // 1. 노드 클릭
      handleNodeClick(nodeId, e);
    } else if (marriageId) {
      // 2. 부부 선/하트 클릭 (드래그 시 가족 이동, 짧은 클릭 시 자녀 추가)
      if (state.mode === 'select') {
        const m = findMarriage(marriageId);
        if (m) {
          state.draggedFamilyNodes = getConnectedFamilyByNode(m.partner1Id);
          const canvasCoords = screenToCanvas(e.clientX, e.clientY);
          state.dragOffset = { x: canvasCoords.x, y: canvasCoords.y };
          state.marriageDragStartCoords = { x: canvasCoords.x, y: canvasCoords.y };
          
          state.marriageClickTime = Date.now();
          state.marriageClickId = marriageId;
          state.marriageDragStarted = false;
        }
      } else {
        handleMarriageClick(marriageId, e);
      }
    } else if (familyMarriageId && state.mode === 'select') {
      // 3. 가족 전체 연결선 드래그 시작
      const m = findMarriage(familyMarriageId);
      if (m) {
        state.draggedFamilyNodes = getConnectedFamilyByNode(m.partner1Id);
        const canvasCoords = screenToCanvas(e.clientX, e.clientY);
        state.dragOffset = { x: canvasCoords.x, y: canvasCoords.y };
        state.marriageDragStartCoords = { x: canvasCoords.x, y: canvasCoords.y };
        state.marriageClickId = null; // 선 드래그는 자녀 생성을 하지 않음
      }
    } else {
      // 4. 빈 배경 클릭 -> 캔버스 Pan 시작
      state.isPanning = true;
      state.panStart.x = e.clientX - state.panX;
      state.panStart.y = e.clientY - state.panY;
      
      // 모드 선택 상태고 드래그를 시작한 것이 아니라면 선택 해제
      if (state.mode === 'select') {
        deselectAll();
      }
    }
  } else if (state.pointerCache.length === 2) {
    // 두 손가락 터치 -> Pinch 줌 시작
    state.isPanning = false;
    state.draggedNode = null;
    
    // 두 터치 지점 거리 계산
    state.prevDiff = getDistance(state.pointerCache[0], state.pointerCache[1]);
  }
}

function onPointerMove(e) {
  // 포인터 캐시 갱신
  const index = state.pointerCache.findIndex(p => p.pointerId === e.pointerId);
  if (index !== -1) {
    state.pointerCache[index] = e;
  }
  
  // 마우스인데 캐시 개수가 비정상인 경우 강제 리셋
  if (e.pointerType === 'mouse' && state.pointerCache.length !== 1) {
    state.pointerCache = [e];
  }
  
  if (state.pointerCache.length === 1) {
    // 단일 터치 제어
    if (state.mode === 'draw') {
      if (state.drawSettings.tool === 'pen' && state.currentPath) {
        const canvasCoords = screenToCanvas(e.clientX, e.clientY);
        const d = state.currentPath.getAttribute('d');
        state.currentPath.setAttribute('d', `${d} L ${canvasCoords.x} ${canvasCoords.y}`);
        e.preventDefault();
        return;
      } else if (state.drawSettings.tool === 'eraser' && state.isErasing) {
        eraseAtPointer(e.clientX, e.clientY);
        e.preventDefault();
        return;
      }
    }
    
    if (state.draggedNode) {
      // 노드 드래그
      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      const targetX = canvasCoords.x - state.dragOffset.x;
      const targetY = canvasCoords.y - state.dragOffset.y;
      
      if (state.nodeDragStartCoords) {
        const totalDx = canvasCoords.x - state.nodeDragStartCoords.x;
        const totalDy = canvasCoords.y - state.nodeDragStartCoords.y;
        if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
          state.nodeDragStarted = true;
          state.draggedNode.manualMoved = true; // 사용자가 실제로 5px 이상 드래그했음을 표시
        }
      } else {
        state.nodeDragStarted = true;
        state.draggedNode.manualMoved = true;
      }
      
      if (state.nodeDragStarted) {
        state.draggedNode.x = targetX;
        state.draggedNode.y = targetY;
        
        // 화면 밖 이탈 방지
        state.draggedNode.x = Math.max(-2000, Math.min(2000, state.draggedNode.x));
        state.draggedNode.y = Math.max(-2000, Math.min(2000, state.draggedNode.y));
        
        // 드래그 중인 일반 노드가 근처의 성별이 일치하는 플레이스홀더 빈칸에 근접해 있는지 검사
        let closestPlaceholder = null;
        let minDist = 60; // 60px 내로 진입하면 흡착 가능한 타겟으로 활성화
        
        state.nodes.forEach(n => {
          if (n.isPlaceholder && n.gender === state.draggedNode.gender) {
            const dist = Math.sqrt(Math.pow(state.draggedNode.x - n.x, 2) + Math.pow(state.draggedNode.y - n.y, 2));
            if (dist < minDist) {
              minDist = dist;
              closestPlaceholder = n;
            }
          }
        });
        
        state.activePlaceholderTargetId = closestPlaceholder ? closestPlaceholder.id : null;
        
        render();
      }
    } else if (state.draggedFamilyNodes) {
      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      const dx = canvasCoords.x - state.dragOffset.x;
      const dy = canvasCoords.y - state.dragOffset.y;
      
      // 누적 이동 거리가 5px 이상이면 드래그로 간주
      if (state.marriageDragStartCoords) {
        const totalDx = canvasCoords.x - state.marriageDragStartCoords.x;
        const totalDy = canvasCoords.y - state.marriageDragStartCoords.y;
        if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
          state.marriageDragStarted = true;
        }
      } else if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        state.marriageDragStarted = true;
      }
      
      state.draggedFamilyNodes.forEach(n => {
        n.x += dx;
        n.y += dy;
        // 실제 드래그로 판별되었을 때만 수동 이동으로 처리 (터치 시 미세한 떨림 무시)
        if (state.marriageDragStarted) {
          n.manualMoved = true;
        }
      });
      
      state.dragOffset.x = canvasCoords.x;
      state.dragOffset.y = canvasCoords.y;
      
      render();
    } else if (state.isPanning) {
      // 캔버스 드래그 이동
      state.panX = e.clientX - state.panStart.x;
      state.panY = e.clientY - state.panStart.y;
      applyTransform();
    }
  } else if (state.pointerCache.length === 2) {
    // 핀치 줌 및 두 손가락 화면 이동(Pan) 제어
    const curDiff = getDistance(state.pointerCache[0], state.pointerCache[1]);
    const centerX = (state.pointerCache[0].clientX + state.pointerCache[1].clientX) / 2;
    const centerY = (state.pointerCache[0].clientY + state.pointerCache[1].clientY) / 2;
    
    if (state.prevDiff > 0) {
      const zoomFactor = curDiff / state.prevDiff;
      zoomAroundPoint(zoomFactor, centerX, centerY);
      
      // 두 손가락 중심점 이동량(Pan) 적용 (필기 모드 등에서도 자유로운 이동 지원)
      if (state.prevPinchCenter) {
        const dx = centerX - state.prevPinchCenter.x;
        const dy = centerY - state.prevPinchCenter.y;
        state.panX += dx;
        state.panY += dy;
        applyTransform();
      }
    }
    
    state.prevDiff = curDiff;
    state.prevPinchCenter = { x: centerX, y: centerY };
  }
}

function onPointerUp(e) {
  // 필기 모드가 아닐 때만 캡처 해제 처리 (캡처 설정 자체가 제외되었으므로)
  if (state.mode !== 'draw') {
    try {
      el.svg.releasePointerCapture(e.pointerId);
    } catch(err) {}
  }

  // 포인터 캐시에서 제거
  state.pointerCache = state.pointerCache.filter(p => p.pointerId !== e.pointerId);
  
  if (state.mode === 'draw') {
    if (state.drawSettings.tool === 'pen' && state.currentPath) {
      state.currentPath = null;
    }
    if (state.drawSettings.tool === 'eraser') {
      state.isErasing = false;
    }
    // 필기 모드일 때는 화면 갱신이나 노드 드래그 종료를 처리할 필요 없음
    if (state.pointerCache.length === 0) return;
  }
  
  if (state.pointerCache.length < 2) {
    state.prevDiff = -1;
    state.prevPinchCenter = null;
  }
  
  if (state.draggedNode && state.nodeDragStarted) {
    // 1. 빈칸 플레이스홀더에 드롭한 경우
    if (state.activePlaceholderTargetId) {
      fillPlaceholder(state.draggedNode.id, state.activePlaceholderTargetId);
      state.activePlaceholderTargetId = null;
    } else {
      // 2. 일반 드롭: 정밀한 수평 정렬 스냅 적용
      let snapY = null;
      let minDeltaY = 50;
      
      state.nodes.forEach(n => {
        if (n.id !== state.draggedNode.id && !n.isPlaceholder) {
          const deltaY = Math.abs(state.draggedNode.y - n.y);
          if (deltaY < minDeltaY) {
            minDeltaY = deltaY;
            snapY = n.y;
          }
        }
      });
      
      if (snapY !== null) {
        state.draggedNode.y = snapY;
      } else {
        state.draggedNode.y = Math.round(state.draggedNode.y / 40) * 40;
      }
      
      state.draggedNode.x = Math.round(state.draggedNode.x / 40) * 40;
    }
  }
  
  // 드래그가 아닌 단순 짧은 클릭이었다면 자녀 추가 동작 수행
  if (state.draggedFamilyNodes && state.marriageClickId && !state.marriageDragStarted) {
    const now = Date.now();
    if (now - state.marriageClickTime < 500) {
      handleMarriageClick(state.marriageClickId, e);
    }
  }
  
  state.draggedNode = null;
  state.nodeDragStarted = false;
  state.draggedFamilyNodes = null;
  state.marriageClickId = null;
  state.marriageDragStartCoords = null;
  state.nodeDragStartCoords = null;
  state.isPanning = false;
  render();
}

// 휠을 통한 포인터 중심 확대/축소
function onWheel(e) {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  zoomAroundPoint(zoomFactor, e.clientX, e.clientY);
}

// --- 10. 좌표 및 화면 비율 계산 함수들 ---
// 터치 기기(아이패드 등)에서 실제 활성화된 물리 터치 개수와 포인터 캐시 강제 동기화
function syncPointerCacheWithTouches(e) {
  if (e.touches) {
    if (e.touches.length === 0) {
      state.pointerCache = [];
      state.prevDiff = -1;
    } else if (e.touches.length === 1 && state.pointerCache.length > 1) {
      // 물리 터치는 1개인데 좀비 캐시가 남아있는 경우, 마지막 터치 정보 1개만 남기고 정리
      if (state.pointerCache.length > 0) {
        state.pointerCache = [state.pointerCache[state.pointerCache.length - 1]];
      } else {
        state.pointerCache = [];
      }
      state.prevDiff = -1;
    }
  }
}

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.clientX - p2.clientX, 2) + Math.pow(p1.clientY - p2.clientY, 2));
}

// 화면 픽셀 좌표 -> 캔버스(SVG) 내 실제 좌표 변환
function screenToCanvas(screenX, screenY) {
  const rect = el.canvasContainer.getBoundingClientRect();
  return {
    x: (screenX - rect.left - state.panX) / state.scale,
    y: (screenY - rect.top - state.panY) / state.scale
  };
}

// 캔버스 카메라 변환 적용
function applyTransform() {
  el.viewportGroup.setAttribute('transform', `translate(${state.panX}, ${state.panY}) scale(${state.scale})`);
  el.htmlOverlayLayer.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
}

// 특정 비율로 캔버스 줌
function zoom(factor) {
  const cx = el.canvasContainer.clientWidth / 2;
  const cy = el.canvasContainer.clientHeight / 2;
  zoomAroundPoint(factor, cx, cy);
}

// 특정 화면 좌표(마우스 커서 또는 핀치 중심) 기준 확대/축소
function zoomAroundPoint(factor, screenX, screenY) {
  const oldScale = state.scale;
  state.scale = Math.max(0.2, Math.min(4.0, state.scale * factor));
  
  const rect = el.canvasContainer.getBoundingClientRect();
  const mouseX = screenX - rect.left;
  const mouseY = screenY - rect.top;
  
  // 줌인 시 동일한 캔버스 위치가 줌 후에도 그 위치에 있도록 pan 조절
  state.panX = mouseX - (mouseX - state.panX) * (state.scale / oldScale);
  state.panY = mouseY - (mouseY - state.panY) * (state.scale / oldScale);
  
  applyTransform();
}

// 화면 최적 맞춤 (Fit to screen)
function fitToScreen() {
  if (state.nodes.length === 0) {
    state.scale = 1.2; // 빈 화면일 때 기본 배율도 키움
    state.panX = el.canvasContainer.clientWidth / 2 - 250;
    state.panY = el.canvasContainer.clientHeight / 2 - 150;
    applyTransform();
    return;
  }
  
  // 전체 노드의 경계 구하기
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  state.nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  });
  
  const width = maxX - minX + 160;
  const height = maxY - minY + 160;
  
  const containerW = el.canvasContainer.clientWidth;
  const containerH = el.canvasContainer.clientHeight;
  
  // 개체가 더 크게 보이도록 scale 범위와 배율 조정 (x1.3)
  state.scale = Math.max(0.8, Math.min(2.0, Math.min(containerW / width, containerH / height) * 1.3));
  state.panX = containerW / 2 - (minX + maxX) / 2 * state.scale;
  state.panY = containerH / 2 - (minY + maxY) / 2 * state.scale;
  
  applyTransform();
}

// --- 11. 인물 / 노드 상호작용 제어 ---
function handleNodeClick(nodeId, e) {
  const node = findNode(nodeId);
  if (!node) return;
  
  if (state.mode === 'select') {
    // 개체 선택
    state.selectedNodeId = nodeId;
    state.selectedMarriageId = null;
    
    // 드래그 설정
    state.draggedNode = node;
    const canvasCoords = screenToCanvas(e.clientX, e.clientY);
    state.dragOffset.x = canvasCoords.x - node.x;
    state.dragOffset.y = canvasCoords.y - node.y;
    state.nodeDragStartCoords = { x: canvasCoords.x, y: canvasCoords.y };
    state.nodeDragStarted = false; // 아직 실제 5px 움직이지 않음
    
    showDetailPanel(node);
    render();
  } else if (state.mode === 'marry') {
    // 부부 연결 모드
    if (!state.marryFirstNodeId) {
      state.marryFirstNodeId = nodeId;
      showToast("배우자(반대 성별)를 터치하여 결혼선을 연결하세요.");
      render();
    } else {
      const firstNode = findNode(state.marryFirstNodeId);
      if (state.marryFirstNodeId === nodeId) {
        state.marryFirstNodeId = null;
        showToast("결혼 연결이 취소되었습니다.");
      } else if (firstNode.gender === node.gender) {
        showToast("남성과 여성 사이에서만 부부 관계가 가능합니다.");
        state.marryFirstNodeId = null;
      } else {
        createMarriage(state.marryFirstNodeId, nodeId);
        showToast("부부 관계가 연결되었습니다.");
        state.marryFirstNodeId = null;
        setMode('select');
      }
      render();
    }
  }
}

function handleMarriageClick(marriageId, e) {
  const marriage = findMarriage(marriageId);
  if (!marriage) return;
  
  // 1) 자녀 즉시 추가
  addChildToMarriage(marriageId);
  showToast("자녀가 추가되었습니다.");
  
  // 2) 상세 정보 패널 표시
  state.selectedMarriageId = marriageId;
  state.selectedNodeId = null;
  showMarriageDetail(marriage);
  render();
}

function getConnectedFamilyByNode(startNodeId) {
  const visited = new Set();
  const queue = [startNodeId];
  const family = [];
  
  while(queue.length > 0) {
    const currId = queue.shift();
    if (visited.has(currId)) continue;
    visited.add(currId);
    
    const node = findNode(currId);
    if (!node) continue;
    family.push(node);
    
    state.marriages.forEach(m => {
      if (m.partner1Id === currId || m.partner2Id === currId) {
        if (!visited.has(m.partner1Id)) queue.push(m.partner1Id);
        if (!visited.has(m.partner2Id)) queue.push(m.partner2Id);
        state.nodes.forEach(n => {
          if (n.parentMarriageId === m.id && !visited.has(n.id)) {
            queue.push(n.id);
          }
        });
      }
    });
    
    if (node.parentMarriageId) {
      const m = findMarriage(node.parentMarriageId);
      if (m) {
        if (!visited.has(m.partner1Id)) queue.push(m.partner1Id);
        if (!visited.has(m.partner2Id)) queue.push(m.partner2Id);
        state.nodes.forEach(n => {
          if (n.parentMarriageId === m.id && !visited.has(n.id)) {
            queue.push(n.id);
          }
        });
      }
    }
  }
  return family;
}

// --- 12. CRUD 동작 기능들 ---
function addIndividual(gender, trait1 = 'normal', trait2 = 'normal') {
  // 화면 중앙 계산하여 생성 (clientX/Y 기준 절대 좌표계로 맞춤)
  const rect = el.canvasContainer.getBoundingClientRect();
  const screenCenterX = rect.left + rect.width / 2;
  const screenCenterY = rect.top + rect.height / 2;
  const canvasCoords = screenToCanvas(screenCenterX, screenCenterY);
  
  // 그리드 스냅 (40px 단위)
  let targetX = Math.round(canvasCoords.x / 40) * 40;
  let targetY = Math.round(canvasCoords.y / 40) * 40;
  
  // 겹침 방지: 해당 위치에 노드가 있으면 X축으로 80px씩 이동하며 빈 자리 찾기
  let overlap = true;
  while (overlap) {
    overlap = state.nodes.some(n => Math.abs(n.x - targetX) < 10 && Math.abs(n.y - targetY) < 10);
    if (overlap) {
      targetX += 80;
    }
  }
  
  const id = 'n_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const newNode = {
    id: id,
    x: targetX,
    y: targetY,
    gender: gender,
    bloodType: 'unknown',
    trait1: trait1,
    trait2: trait2,
    name: '',
    genotype: '',
    parentMarriageId: null
  };
  
  state.nodes.push(newNode);
  state.selectedNodeId = id;
  state.selectedMarriageId = null;
  showDetailPanel(newNode);
  
  render();
  showToast("개체가 화면 중앙에 추가되었습니다.");
}

function addCouple() {
  const rect = el.canvasContainer.getBoundingClientRect();
  const screenCenterX = rect.left + rect.width / 2;
  const screenCenterY = rect.top + rect.height / 2;
  const canvasCoords = screenToCanvas(screenCenterX, screenCenterY);
  
  // 그리드 스냅 (40px 단위)
  let targetX = Math.round(canvasCoords.x / 40) * 40;
  let targetY = Math.round(canvasCoords.y / 40) * 40;
  
  // 겹침 방지 (두 개체가 들어갈 자리가 모두 비어있는지 확인)
  let overlap = true;
  while (overlap) {
    overlap = state.nodes.some(n => Math.abs(n.x - (targetX - 80)) < 10 && Math.abs(n.y - targetY) < 10) ||
              state.nodes.some(n => Math.abs(n.x - (targetX + 80)) < 10 && Math.abs(n.y - targetY) < 10);
    if (overlap) {
      targetY += 120; // 겹치면 아래로 배치
    }
  }
  
  const idM = 'n_' + Date.now() + '_M';
  const idF = 'n_' + Date.now() + '_F';
  
  const maleNode = {
    id: idM, x: targetX - 80, y: targetY, gender: 'M', name: '', trait1: 'normal', trait2: 'normal', parentMarriageId: null, genotype: ''
  };
  const femaleNode = {
    id: idF, x: targetX + 80, y: targetY, gender: 'F', name: '', trait1: 'normal', trait2: 'normal', parentMarriageId: null, genotype: ''
  };
  
  state.nodes.push(maleNode, femaleNode);
  createMarriage(idM, idF);
  
  deselectAll();
  render();
  showToast("부부가 화면 중앙에 추가되었습니다.");
}

function createMarriage(id1, id2) {
  // 이미 성립된 결혼 관계인지 체크
  const exist = state.marriages.some(m => 
    (m.partner1Id === id1 && m.partner2Id === id2) || 
    (m.partner1Id === id2 && m.partner2Id === id1)
  );
  
  if (exist) {
    showToast("이미 결혼 상태인 커플입니다.");
    return;
  }
  
  const id = 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  state.marriages.push({
    id: id,
    partner1Id: id1,
    partner2Id: id2
  });
}

function addChildToMarriage(marriageId) {
  const marriage = findMarriage(marriageId);
  if (!marriage) return;
  
  const p1 = findNode(marriage.partner1Id);
  const p2 = findNode(marriage.partner2Id);
  
  // 부모 아래 적당한 위치에 생성
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  
  const childId = 'n_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const newChild = {
    id: childId,
    x: midX, // 임시 위치, 아래에서 재배치됨
    y: midY + 160, // 한 세대 아래로
    gender: Math.random() > 0.5 ? 'M' : 'F', // 무작위 성별
    name: '',
    bloodType: 'unknown',
    trait1: 'normal',
    trait2: 'normal',
    parentMarriageId: marriageId,
    genotype: '',
    manualMoved: false
  };
  
  state.nodes.push(newChild);
  
  // 수동으로 이동하지 않은 형제 노드들만 찾아 대칭 배열
  const siblings = state.nodes.filter(n => n.parentMarriageId === marriageId);
  const autoSiblings = siblings.filter(n => !n.manualMoved);
  
  // x좌표 순서대로 정렬 (시각적 순서 유지)
  autoSiblings.sort((a, b) => a.x - b.x);
  
  const spacing = 120;
  const startX = midX - ((autoSiblings.length - 1) * spacing) / 2;
  
  autoSiblings.forEach((child, index) => {
    child.x = startX + index * spacing;
  });
  
  state.selectedNodeId = childId;
  state.selectedMarriageId = null;
  showDetailPanel(newChild);
}

function deleteSelected() {
  if (state.selectedNodeId) {
    const id = state.selectedNodeId;
    // 1. 해당 노드와 연결된 결혼 관계 삭제
    const affectedMarriages = state.marriages.filter(m => m.partner1Id === id || m.partner2Id === id);
    affectedMarriages.forEach(m => {
      // 해당 결혼 관계에서 파생된 자식들의 부모 관계도 끊어줌
      state.nodes.forEach(n => {
        if (n.parentMarriageId === m.id) {
          n.parentMarriageId = null;
        }
      });
    });
    
    state.marriages = state.marriages.filter(m => m.partner1Id !== id && m.partner2Id !== id);
    
    // 2. 노드 삭제
    state.nodes = state.nodes.filter(n => n.id !== id);
    deselectAll();
    showToast("개체와 관련된 모든 연결 관계가 삭제되었습니다.");
  } else if (state.selectedMarriageId) {
    const mId = state.selectedMarriageId;
    // 해당 결혼 관계 자손들의 부모 연결만 해제
    state.nodes.forEach(n => {
      if (n.parentMarriageId === mId) {
        n.parentMarriageId = null;
      }
    });
    // 결혼 관계선만 삭제
    state.marriages = state.marriages.filter(m => m.id !== mId);
    deselectAll();
    showToast("결혼 관계가 끊어졌습니다 (개체는 유지).");
  }
  render();
}
// (Duplicate setMode removed)
function clearAll() {
  state.nodes = [];
  state.marriages = [];
  state.nextId = 1;
  state.nextMarriageId = 1;
  state.selectedNodeId = null;
  state.selectedMarriageId = null;
  el.drawLayer.innerHTML = '';
  deselectAll();
  fitToScreen();
  showToast("화면이 초기화되었습니다.");
  render();
  hideDetailPanel();
}

// --- 13. UI 패널 정보 업데이트 ---
function showDetailPanel(node) {
  el.detailPanel.classList.add('visible');
  el.nodeNameInput.value = node.name;
  el.nodeGenderSelect.value = node.gender;
  el.nodeBloodTypeSelect.value = node.bloodType;
  el.nodeTrait1Select.value = node.trait1;
  el.nodeTrait2Select.value = node.trait2;
  
  if (state.settings.inheritanceMode === 'abo') {
    el.bloodTypeRow.style.display = 'flex';
    el.trait1Row.style.display = 'none';
  } else {
    el.bloodTypeRow.style.display = 'none';
    el.trait1Row.style.display = 'flex';
  }
  
  // 유전자 설정에 맞게 선택형 리스트 갱신
  updateDetailPanelGenotypes();
  
  if (node.genotype) {
    el.nodeGenotypeSelect.value = node.genotype;
  }
  el.nodeGenotypeCustom.value = node.genotype;
}

function showMarriageDetail(marriage) {
  el.detailPanel.classList.add('visible');
  el.nodeNameInput.value = '부부 결합선';
  el.nodeGenderSelect.value = ''; // 성별 해당 없음
  el.nodeBloodTypeSelect.value = '';
  el.nodeTrait1Select.value = '';
  el.nodeTrait2Select.value = '';
  el.nodeGenotypeSelect.innerHTML = '';
  el.nodeGenotypeCustom.value = '';
}

function deselectAll() {
  state.selectedNodeId = null;
  state.selectedMarriageId = null;
  el.detailPanel.classList.remove('visible');
  render();
}

function updateDetailPanelGenotypes() {
  if (!state.selectedNodeId) return;
  const node = findNode(state.selectedNodeId);
  if (!node) return;
  
  const gender = node.gender;
  const chr = state.settings.chromosome;
  const traitCnt = state.settings.traitCount;
  
  let options = [];
  
  const L1_D = state.settings.trait1Dom || 'A';
  const L1_R = state.settings.trait1Rec || 'a';
  const L2_D = state.settings.trait2Dom || 'B';
  const L2_R = state.settings.trait2Rec || 'b';

  const superscriptMap = {
    'A':'ᴬ', 'B':'ᴮ', 'C':'ᶜ', 'D':'ᴰ', 'E':'ᴱ', 'F':'ᶠ', 'G':'ᴳ', 'H':'ᴴ', 'I':'ᴵ', 'J':'ᴶ', 'K':'ᴷ', 'L':'ᴸ', 'M':'ᴹ', 'N':'ᴺ', 'O':'ᴼ', 'P':'ᴾ', 'Q':'Q', 'R':'ᴿ', 'S':'ˢ', 'T':'ᵀ', 'U':'ᵁ', 'V':'ⱽ', 'W':'ᵂ', 'X':'ˣ', 'Y':'ʸ', 'Z':'ᶻ',
    'a':'ᵃ', 'b':'ᵇ', 'c':'ᶜ', 'd':'ᵈ', 'e':'ᵉ', 'f':'ᶠ', 'g':'ᵍ', 'h':'ʰ', 'i':'ⁱ', 'j':'ʲ', 'k':'ᵏ', 'l':'ˡ', 'm':'ᵐ', 'n':'ⁿ', 'o':'ᵒ', 'p':'ᵖ', 'q':'q', 'r':'ʳ', 's':'ˢ', 't':'ᵗ', 'u':'ᵘ', 'v':'ᵛ', 'w':'ʷ', 'x':'ˣ', 'y':'ʸ', 'z':'ᶻ', '*':'*'
  };
  const getSup = (str) => {
    return str.split('').map(c => superscriptMap[c] || '^' + c).join('');
  };

  const S1_D = getSup(L1_D);
  const S1_R = getSup(L1_R);
  const S2_D = getSup(L2_D);
  const S2_R = getSup(L2_R);

  if (state.settings.inheritanceMode === 'abo') {
    let aboOptions = [
      'AA', 'AO', 'A_',
      'BB', 'BO', 'B_',
      'AB', 'OO'
    ];
    
    if (traitCnt === 1) {
      options = aboOptions;
    } else {
      let t2Options = [];
      if (chr === 'autosomal') {
        t2Options = [`${L2_D}${L2_D}`, `${L2_D}${L2_R}`, `${L2_R}${L2_R}`, `${L2_D}_`, `${L2_R}_`];
      } else { // sex_linked
        if (gender === 'M') {
          t2Options = [`X${S2_D}Y`, `X${S2_R}Y`];
        } else {
          t2Options = [`X${S2_D}X${S2_D}`, `X${S2_D}X${S2_R}`, `X${S2_R}X${S2_R}`];
        }
      }
      // 조합
      for (let abo of aboOptions) {
        for (let t2 of t2Options) {
          options.push(`${abo} ${t2}`);
        }
      }
    }
  } else if (chr === 'mixed') {
    // 복합 유전: 1형질(상염색체) + 2형질(성염색체)
    const t1Options = [`${L1_D}${L1_D}`, `${L1_D}${L1_R}`, `${L1_R}${L1_R}`, `${L1_D}_`, `${L1_R}_`];
    let t2Options = [];
    if (gender === 'M') {
      t2Options = [`X${S2_D}Y`, `X${S2_R}Y`];
    } else {
      t2Options = [`X${S2_D}X${S2_D}`, `X${S2_D}X${S2_R}`, `X${S2_R}X${S2_R}`];
    }
    for (let t1 of t1Options) {
      for (let t2 of t2Options) {
        options.push(`${t1} ${t2}`);
      }
    }
  } else if (chr === 'autosomal') {
    // 상염색체
    if (traitCnt === 1) {
      options = [`${L1_D}${L1_D}`, `${L1_D}${L1_R}`, `${L1_R}${L1_R}`, `${L1_D}_`, `${L1_R}_`];
    } else {
      if (state.settings.linkage === 'coupling') {
        options = [`${L1_D}${L2_D}/${L1_D}${L2_D}`, `${L1_D}${L2_D}/${L1_R}${L2_R}`, `${L1_R}${L2_R}/${L1_R}${L2_R}`];
      } else if (state.settings.linkage === 'repulsion') {
        options = [`${L1_D}${L2_R}/${L1_D}${L2_R}`, `${L1_D}${L2_R}/${L1_R}${L2_D}`, `${L1_R}${L2_D}/${L1_R}${L2_D}`];
      } else {
        // 2형질 독립
        options = [`${L1_D}${L1_D}${L2_D}${L2_D}`, `${L1_D}${L1_R}${L2_D}${L2_D}`, `${L1_R}${L1_R}${L2_D}${L2_D}`, `${L1_D}${L1_D}${L2_D}${L2_R}`, `${L1_D}${L1_R}${L2_D}${L2_R}`, `${L1_R}${L1_R}${L2_D}${L2_R}`, `${L1_D}${L1_D}${L2_R}${L2_R}`, `${L1_D}${L1_R}${L2_R}${L2_R}`, `${L1_R}${L1_R}${L2_R}${L2_R}`, `${L1_D}_${L2_D}_`, `${L1_D}_${L2_R}${L2_R}`, `${L1_R}${L1_R}${L2_D}_`];
      }
    }
  } else {
    // 성염색체 (반성 유전)
    const notation = state.settings.notation;
    if (traitCnt === 1) {
      if (notation === 'prime') {
        if (gender === 'M') {
          options = ['XY', 'X\'Y'];
        } else {
          options = ['XX', 'XX\'', 'X\'X\''];
        }
      } else { // superscript
        if (gender === 'M') {
          options = [`X${S1_D}Y`, `X${S1_R}Y`];
        } else {
          options = [`X${S1_D}X${S1_D}`, `X${S1_D}X${S1_R}`, `X${S1_R}X${S1_R}`];
        }
      }
    } else {
      // 2형질 반성 (X에 두 유전자 동시 얹힘)
      if (gender === 'M') {
        options = [`X${S1_D}${S2_D}Y`, `X${S1_D}${S2_R}Y`, `X${S1_R}${S2_D}Y`, `X${S1_R}${S2_R}Y`];
      } else {
        options = [`X${S1_D}${S2_D}X${S1_D}${S2_D}`, `X${S1_D}${S2_D}X${S1_D}${S2_R}`, `X${S1_D}${S2_D}X${S1_R}${S2_D}`, `X${S1_D}${S2_D}X${S1_R}${S2_R}`, `X${S1_D}${S2_R}X${S1_D}${S2_R}`, `X${S1_D}${S2_R}X${S1_R}${S2_D}`, `X${S1_D}${S2_R}X${S1_R}${S2_R}`, `X${S1_R}${S2_D}X${S1_R}${S2_D}`, `X${S1_R}${S2_D}X${S1_R}${S2_R}`, `X${S1_R}${S2_R}X${S1_R}${S2_R}`];
      }
    }
  }
  
  // HTML 동적 주입
  options.unshift('-- 선택 --');
  el.nodeGenotypeSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  
  // 현재 노드의 유전자형 세팅
  if (!node.genotype) {
    el.nodeGenotypeSelect.value = '-- 선택 --';
    el.nodeGenotypeCustom.value = '';
  } else if (!options.includes(node.genotype)) {
    el.nodeGenotypeSelect.selectedIndex = -1;
    el.nodeGenotypeCustom.value = node.genotype;
  } else {
    el.nodeGenotypeSelect.value = node.genotype;
    el.nodeGenotypeCustom.value = node.genotype;
  }
}

// Toast 경고창 표출
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('visible');
  setTimeout(() => {
    el.toast.classList.remove('visible');
  }, 3500);
}

// --- 14. SVG 렌더링 엔진 (Drawing) ---
function render() {
  // 1. 초기 캔버스 비우기
  el.linesGroup.innerHTML = '';
  el.nodesGroup.innerHTML = '';
  if (el.htmlOverlayLayer) el.htmlOverlayLayer.innerHTML = '';
  
  // 2. 자녀 선 그리기 (완벽한 직교 연결선) - 부부 노드 밑에 깔리도록 먼저 그리기
  state.marriages.forEach(m => {
    const children = state.nodes.filter(n => n.parentMarriageId === m.id);
    if (children.length === 0) return;
    
    const p1 = findNode(m.partner1Id);
    const p2 = findNode(m.partner2Id);
    if (!p1 || !p2) return;
    
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const anchorY = midY + 80; // 결혼 결선에서 떨어지는 수직 가지 높이
    
    // 부부선 중간 -> 공통 자손 가로대 중심 수직 낙하선
    const dropLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dropLine.setAttribute('x1', midX);
    dropLine.setAttribute('y1', midY);
    dropLine.setAttribute('x2', midX);
    dropLine.setAttribute('y2', anchorY);
    dropLine.setAttribute('class', 'pedigree-connection-line');
    dropLine.setAttribute('data-family-marriage-id', m.id);
    dropLine.style.cursor = 'grab';
    el.linesGroup.appendChild(dropLine);
    
    // 각 자녀들의 수직 연결선
    children.forEach(c => {
      const childTopY = c.y - 20; // 노드 크기의 윗선 테두리
      
      // 수평 자매 브릿지 (부모 중간 X -> 자녀 X)
      const horLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      horLine.setAttribute('x1', midX);
      horLine.setAttribute('y1', anchorY);
      horLine.setAttribute('x2', c.x);
      horLine.setAttribute('y2', anchorY);
      horLine.setAttribute('class', 'pedigree-connection-line');
      horLine.setAttribute('data-family-marriage-id', m.id);
      horLine.style.cursor = 'grab';
      el.linesGroup.appendChild(horLine);
      
      // 가로대 수평 -> 자녀 윗부분 수직선
      const childLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      childLine.setAttribute('x1', c.x);
      childLine.setAttribute('y1', anchorY);
      childLine.setAttribute('x2', c.x);
      childLine.setAttribute('y2', childTopY);
      childLine.setAttribute('class', 'pedigree-connection-line');
      childLine.setAttribute('data-family-marriage-id', m.id);
      childLine.style.cursor = 'grab';
      el.linesGroup.appendChild(childLine);
    });
  });
  
  // 3. 부부 선 그리기 (가로선 및 중앙 노드) - 자녀 선보다 위에 덮이도록 나중에 그리기
  state.marriages.forEach(m => {
    const p1 = findNode(m.partner1Id);
    const p2 = findNode(m.partner2Id);
    if (!p1 || !p2) return;
    
    // 부부 사이를 가로로 이어주는 선
    const isSelected = state.selectedMarriageId === m.id;
                         
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y2', p2.y);
    line.setAttribute('class', `pedigree-connection-line`);
    line.setAttribute('data-family-marriage-id', m.id);
    line.style.cursor = 'grab';
    if (isSelected) {
      line.setAttribute('stroke', 'var(--node-selected-stroke)');
      line.setAttribute('stroke-width', '5px');
    }
    el.linesGroup.appendChild(line);
    
    // 결선 중앙의 대화형 결혼 노드
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const marryNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    marryNode.setAttribute('class', `marriage-node ${isSelected ? 'selected' : ''}`);
    marryNode.setAttribute('data-marriage-id', m.id);
    marryNode.setAttribute('transform', `translate(${midX}, ${midY})`);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '8');
    circle.setAttribute('data-marriage-id', m.id);
    
    marryNode.appendChild(circle);
    el.linesGroup.appendChild(marryNode);
  });
  
  // 4. 인물 노드 그리기
  state.nodes.forEach(n => {
    const isSelected = state.selectedNodeId === n.id;
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let classStr = `pedigree-node ${isSelected ? 'selected' : ''}`;
    if (n.isPlaceholder) {
      classStr += ' placeholder';
      if (state.activePlaceholderTargetId === n.id) {
        classStr += ' active-target';
      }
    }
    group.setAttribute('class', classStr);
    // 드래그/이벤트용 번역 속성 추가
    group.setAttribute('transform', `translate(${n.x}, ${n.y})`);
    group.setAttribute('data-node-id', n.id);
    
    // 기본 모양 요소
    let shape;
    if (n.gender === 'M') {
      // 남자는 사각형
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', '-20');
      shape.setAttribute('y', '-20');
      shape.setAttribute('width', '40');
      shape.setAttribute('height', '40');
      shape.setAttribute('rx', '4');
    } else {
      // 여자는 원형
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shape.setAttribute('cx', '0');
      shape.setAttribute('cy', '0');
      shape.setAttribute('r', '20');
    }
    
    shape.setAttribute('data-node-id', n.id);
    
    // 형질 채우기 및 빗금 스타일 세팅
    applyTraitFill(shape, n);
    group.appendChild(shape);
    
    // 복합 형질(2형질)에서 빗금 오버레이 필요시 (플레이스홀더 빈칸인 경우 빗금 생략, ABO 모드에서는 빗금 생략)
    if (!n.isPlaceholder && n.trait2 === 'affected' && state.settings.inheritanceMode !== 'abo') {
      let hatchOverlay;
      if (n.gender === 'M') {
        hatchOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hatchOverlay.setAttribute('x', '-20');
        hatchOverlay.setAttribute('y', '-20');
        hatchOverlay.setAttribute('width', '40');
        hatchOverlay.setAttribute('height', '40');
        hatchOverlay.setAttribute('rx', '4');
      } else {
        hatchOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hatchOverlay.setAttribute('cx', '0');
        hatchOverlay.setAttribute('cy', '0');
        hatchOverlay.setAttribute('r', '20');
      }
      hatchOverlay.setAttribute('fill', `url(#hatch-pattern-${state.theme})`);
      hatchOverlay.setAttribute('pointer-events', 'none'); // 오버레이 터치 차단
      group.appendChild(hatchOverlay);
    }
    
    // ABO 혈액형 텍스트 중앙에 표시
    if (state.settings.inheritanceMode === 'abo' && n.bloodType && n.bloodType !== 'unknown' && !n.isPlaceholder) {
      const bloodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      bloodText.setAttribute('x', '0');
      bloodText.setAttribute('y', '6'); // 텍스트 중앙 위치 보정
      bloodText.setAttribute('text-anchor', 'middle');
      bloodText.setAttribute('font-size', '18px');
      bloodText.setAttribute('font-weight', 'bold');
      
      // 배경색(trait2 발현 시)이 진할 경우 글씨를 밝게, 아닐 경우 테마에 맞춤
      const isFilled = (n.trait2 === 'affected' && state.settings.traitCount === 2);
      if (isFilled) {
        bloodText.setAttribute('fill', '#ffffff'); // 색칠된 배경에선 항상 흰글씨
      } else {
        bloodText.setAttribute('fill', state.theme === 'dark' ? '#f8fafc' : '#0f172a');
      }
      
      bloodText.textContent = n.bloodType;
      group.appendChild(bloodText);
    }
    
    // 라벨/이름 텍스트 추가 (빈칸 플레이스홀더는 "?" 출력)
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '0');
    label.setAttribute('class', 'pedigree-node-text');
    
    if (n.isPlaceholder) {
      label.textContent = "?";
      label.setAttribute('y', '6');
      label.setAttribute('font-size', '20px');
      label.setAttribute('font-weight', 'bold');
    } else {
      label.textContent = n.name;
      label.setAttribute('y', '42'); // 글씨 크기 증가로 인해 더 아래로 내림
    }
    group.appendChild(label);
    
    // 유전자형 텍스트 추가 (보이기 활성화 시, 플레이스홀더 제외)
    if (state.settings.showGenotype && !n.isPlaceholder) {
      if (isSelected && state.mode === 'select') {
        const select = document.createElement('select');
        select.style.position = 'absolute';
        select.style.left = `${n.x - 60}px`;
        select.style.top = `${n.y - 65}px`;
        select.style.width = '120px';
        select.style.height = '36px';
        select.style.fontSize = '18px';
        select.style.fontFamily = "'Outfit', sans-serif";
        select.style.fontWeight = 'bold';
        const genotypeColor = state.theme === 'dark' ? '#eab308' : '#111827';
        select.style.color = genotypeColor;
        select.style.textAlign = 'center';
        select.style.cursor = 'pointer';
        select.style.border = `2px solid ${genotypeColor}`;
        select.style.borderRadius = '6px';
        select.style.backgroundColor = state.theme === 'dark' ? '#1e293b' : '#ffffff';
        select.style.outline = 'none';
        select.style.pointerEvents = 'auto'; // 상위 레이어의 pointer-events: none 무시
        
        // iOS Safari Ghost Click 방지: 드롭다운이 열려있을 때 SVG 터치 차단
        select.addEventListener('focus', () => {
          el.svg.style.pointerEvents = 'none';
        });
        
        select.addEventListener('blur', () => {
          el.svg.style.pointerEvents = 'auto';
          state.draggedNode = null;
          state.pointerCache = [];
        });
        
        select.addEventListener('change', e => {
          n.genotype = e.target.value;
          el.nodeGenotypeCustom.value = n.genotype;
          el.nodeGenotypeSelect.value = n.genotype;
          
          el.svg.style.pointerEvents = 'auto';
          state.draggedNode = null;
          state.pointerCache = [];
          
          render();
        });
        
        // 유전자형이 지정되지 않은 경우 첫 번째 옵션 선택 시 change 이벤트가 트리거되지 않는 문제를 방지하기 위해 숨겨진 플레이스홀더를 삽입
        if (!n.genotype) {
          const emptyOpt = document.createElement('option');
          emptyOpt.value = '';
          emptyOpt.textContent = '선택';
          emptyOpt.selected = true;
          emptyOpt.hidden = true;
          emptyOpt.disabled = true;
          select.appendChild(emptyOpt);
        }

        // 사이드바용으로 업데이트된 최신 유전자형 옵션 목록을 그대로 복사하여 사용
        Array.from(el.nodeGenotypeSelect.options).forEach(opt => {
          if (opt.value === '-- 선택 --') return; // 캔버스에서는 '-- 선택 --' 항목 표시 제외
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.textContent;
          if (n.genotype === opt.value) option.selected = true;
          select.appendChild(option);
        });
        
        if (el.htmlOverlayLayer) {
          el.htmlOverlayLayer.appendChild(select);
        }
      } else {
        let displayGenotype = n.genotype;
        if (displayGenotype) {
          // 유전자형 텍스트 길이에 맞춰 상자 너비 대략적 계산
          const charLen = displayGenotype.length;
          const bgWidth = Math.max(48, charLen * 14 + 20);
          const bgHeight = 34;
          
          // 배경 상자 생성
          const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('x', -bgWidth / 2);
          bgRect.setAttribute('y', '-62');
          bgRect.setAttribute('width', bgWidth);
          bgRect.setAttribute('height', bgHeight);
          bgRect.setAttribute('rx', '6'); // 둥근 모서리
          // 테마에 맞는 불투명 배경색과 테두리 적용 (가계도 선 가리기용)
          bgRect.setAttribute('fill', 'var(--bg-primary)');
          bgRect.setAttribute('stroke', 'var(--border-color)');
          bgRect.setAttribute('stroke-width', '2');
          
          const geno = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          geno.setAttribute('x', '0');
          geno.setAttribute('y', '-38'); // 상자 내부 중앙 (텍스트 베이스라인)
          geno.setAttribute('class', 'pedigree-node-genotype');
          
          if (state.settings.inheritanceMode === 'abo') {
            const parts = displayGenotype.split(' ');
            const aboPart = parts[0];
            const otherPart = parts.slice(1).join(' ');
            
            const tspanAbo = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspanAbo.setAttribute('fill', '#ef4444'); // 빨간색
            tspanAbo.textContent = aboPart;
            geno.appendChild(tspanAbo);
            
            if (otherPart) {
              const tspanOther = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              const t2Color = (state.settings.chromosome === 'autosomal') 
                  ? (state.theme === 'dark' ? '#eab308' : '#111827') 
                  : (state.theme === 'dark' ? '#ffffff' : '#3b82f6');
              tspanOther.setAttribute('fill', t2Color);
              tspanOther.textContent = ' ' + otherPart;
              geno.appendChild(tspanOther);
            }
          } else if (state.settings.chromosome === 'mixed') {
            const parts = displayGenotype.split(' ');
            const t1Part = parts[0];
            const t2Part = parts.slice(1).join(' ');
            
            const tspanT1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspanT1.setAttribute('fill', state.theme === 'dark' ? '#eab308' : '#111827');
            tspanT1.textContent = t1Part;
            geno.appendChild(tspanT1);
            
            if (t2Part) {
              const tspanT2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspanT2.setAttribute('fill', state.theme === 'dark' ? '#ffffff' : '#3b82f6');
              tspanT2.textContent = ' ' + t2Part;
              geno.appendChild(tspanT2);
            }
          } else {
            const singleColor = (state.settings.chromosome === 'autosomal')
                  ? (state.theme === 'dark' ? '#eab308' : '#111827')
                  : (state.theme === 'dark' ? '#ffffff' : '#3b82f6');
            geno.setAttribute('fill', singleColor);
            geno.textContent = displayGenotype;
          }
          
          // 상자를 먼저 추가해서 텍스트보다 뒤에 오도록 함
          group.appendChild(bgRect);
          group.appendChild(geno);
        }
      }
    }
    
    // 부부연결 대기 시 하이라이트 효과
    if (state.mode === 'marry' && state.marryFirstNodeId === n.id) {
      shape.setAttribute('stroke', '#3b82f6');
      shape.setAttribute('stroke-width', '5px');
    }
    
    el.nodesGroup.appendChild(group);
  });
}

// 형질 여부에 따라 노드 바탕 색 채우기
function applyTraitFill(shape, node) {
  if (state.settings.inheritanceMode === 'abo') {
    // ABO 모드: 두 번째 형질(trait2)이 1형질처럼 색칠(fill)을 담당
    const trait2 = node.trait2 === 'affected';
    if (trait2 && state.settings.traitCount === 2) {
      shape.setAttribute('fill', 'var(--trait-1-color)'); 
    } else {
      shape.setAttribute('fill', 'var(--node-bg)');
    }
    shape.setAttribute('stroke', 'var(--node-stroke)');
    shape.setAttribute('stroke-width', '3.5');
    return;
  }

  const trait1 = node.trait1 === 'affected';
  const trait2 = node.trait2 === 'affected';
  
  // 2개 형질 복합 판단 (설정과 무관하게 노드 속성에 따라 그리기)
  if (trait1 && trait2) {
    shape.setAttribute('fill', 'var(--trait-1-color)'); // 바탕은 형질 1
    shape.setAttribute('stroke', 'var(--node-stroke)');
  } else if (trait1) {
    shape.setAttribute('fill', 'var(--trait-1-color)');
    shape.setAttribute('stroke', 'var(--node-stroke)');
  } else if (trait2) {
    shape.setAttribute('fill', 'var(--node-bg)'); // 빗금 오버레이가 들어갈 것이므로 바탕은 투명/기본
    shape.setAttribute('stroke', 'var(--node-stroke)');
  } else {
    shape.setAttribute('fill', 'var(--node-bg)');
    shape.setAttribute('stroke', 'var(--node-stroke)');
  }
  
  shape.setAttribute('stroke-width', '3.5');
}





// --- 18. 유틸리티 함수들 ---
function findNode(id) {
  return state.nodes.find(n => n.id === id);
}

function findMarriage(id) {
  return state.marriages.find(m => m.id === id);
}

// --- 19. 범례 클릭 및 플레이스홀더 처리 함수 ---
function onLegendClick(e) {
  e.preventDefault();
  
  const target = e.currentTarget;
  const gender = target.getAttribute('data-gender');
  const trait1 = target.getAttribute('data-trait1');
  const trait2 = target.getAttribute('data-trait2');
  
  if (state.selectedNodeId) {
    // 선택된 개체가 있으면 해당 개체의 속성을 변경
    const node = findNode(state.selectedNodeId);
    if (node) {
      if (node.isPlaceholder) {
        // 플레이스홀더인 경우 선택한 범례 항목으로 교체
        node.isPlaceholder = false;
        node.gender = gender;
        node.trait1 = trait1;
        node.trait2 = trait2;
        
        showDetailPanel(node); 
        render();
        showToast("빈칸이 선택한 개체로 채워졌습니다.");
        return;
      } else {
        // 일반 노드인 경우 성별 변경 시 부부 관계 동성 혼인 체크
        if (node.gender !== gender) {
          const isSpouseSameGender = state.marriages.some(m => {
            if (m.partner1Id === node.id) {
              const spouse = findNode(m.partner2Id);
              return spouse && spouse.gender === gender;
            }
            if (m.partner2Id === node.id) {
              const spouse = findNode(m.partner1Id);
              return spouse && spouse.gender === gender;
            }
            return false;
          });
          
          if (isSpouseSameGender) {
            showToast("부부 관계에 있는 개체는 동성으로 변경할 수 없습니다.");
            return;
          }
        }
        
        node.gender = gender;
        node.trait1 = trait1;
        node.trait2 = trait2;
        
        // 유전자형 갱신 등 상세 패널 내용 업데이트
        showDetailPanel(node); 
        render();
        showToast("선택된 개체의 형질과 성별이 변경되었습니다.");
        return;
      }
    }
  }
  
  // 선택된 개체가 없으면 화면 중앙에 새 개체 추가
  addIndividual(gender, trait1, trait2);
}

function fillPlaceholder(nodeId, placeholderId) {
  const node = findNode(nodeId);
  const placeholder = findNode(placeholderId);
  if (!node || !placeholder) return;
  
  // 1. 노드를 플레이스홀더 위치로 완벽히 일치시킴
  node.x = placeholder.x;
  node.y = placeholder.y;
  node.name = placeholder.name; // 플레이스홀더 이름 승계 (예: I-1, II-2 등)
  
  // 2. 플레이스홀더의 결혼(Marriages) 관계를 신규 노드로 이전
  state.marriages.forEach(m => {
    if (m.partner1Id === placeholderId) m.partner1Id = nodeId;
    if (m.partner2Id === placeholderId) m.partner2Id = nodeId;
  });
  
  // 3. 플레이스홀더의 부모 결선 링크 승계
  node.parentMarriageId = placeholder.parentMarriageId;
  
  // 4. 기존 플레이스홀더 노드 삭제
  state.nodes = state.nodes.filter(n => n.id !== placeholderId);
  
  showToast("빈칸(?) 채우기에 성공하여 연결 관계가 상속되었습니다!");
}
