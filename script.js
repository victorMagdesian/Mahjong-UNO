/****************************************************
 * VARIÁVEIS GLOBAIS
 ****************************************************/
let deck = [];
let playerHand = [];
let banishedCards = [];
let gameStarted = false;
let gameEnded = false;
let selectedSort = ""; // "sequence" | "group" | "victory"
let currentSortMethod = null;

let playerScore = 0; // Começa em 0
let boughtCard = null; // Carta comprada, fora da mão

/****************************************************
 * FUNÇÃO: CRIAR BARALHO (UNO 1–9, 4 cores, 2 cópias)
 ****************************************************/
function createDeck() {
  const colors = ["red", "blue", "green", "yellow"];
  const numbers = [1,2,3,4,5,6,7,8,9];
  let newDeck = [];

  for (let color of colors) {
    for (let num of numbers) {
      newDeck.push({color, value: num});
      newDeck.push({color, value: num});
    }
  }
  return newDeck;
}

/****************************************************
 * EMBARALHAR (Fisher-Yates)
 ****************************************************/
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/****************************************************
 * INICIAR JOGO (mão com 11 cartas)
 ****************************************************/
function startGame() {
  resetGameState();

  // Dá 11 cartas
  for (let i = 0; i < 11; i++) {
    playerHand.push(deck.pop());
  }

  document.getElementById("gameSection").classList.remove("hidden");
  document.getElementById("message").textContent = "Jogo iniciado!";
  gameStarted = true;
  gameEnded = false;

  renderHand();
  renderBanishedCards();
}

/****************************************************
 * REINICIAR JOGO (RESET TOTAL)
 ****************************************************/
function resetGameState() {
  deck = shuffle(createDeck());
  playerHand = [];
  banishedCards = [];
  boughtCard = null;

  gameStarted = false;
  gameEnded = false;
  currentSortMethod = null;
  selectedSort = "";

  // Desativa IA (caso tenha sido liberada)
  const iaBtn = document.getElementById("btnSortVictory");
  iaBtn.disabled = true;
  iaBtn.classList.add("locked");
  updateIAScoreStatus();

  // Esconde a seção do jogo
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("message").textContent = "";
  renderBoughtCard();
}

/****************************************************
 * RENDERIZAR MÃO
 ****************************************************/
function renderHand() {
  const handDiv = document.getElementById("playerHand");
  handDiv.innerHTML = "";

  playerHand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card", card.color);
    cardEl.textContent = card.value;
    cardEl.setAttribute("data-value", card.value);

    // Clique: descarta esta carta da mão
    cardEl.addEventListener("click", () => {
      discardCard(index);
    });
    handDiv.appendChild(cardEl);
  });

  // Reaplica a ordenação escolhida, se houver
  reapplySort();
}

/****************************************************
 * RENDERIZAR CARTAS BANIDAS
 ****************************************************/
function renderBanishedCards() {
  const banishSection = document.getElementById("banishSection");
  const banishedDiv = document.getElementById("banishedCards");

  if (banishedCards.length === 0) {
    banishSection.classList.add("hidden");
    return;
  }
  banishSection.classList.remove("hidden");
  banishedDiv.innerHTML = "";

  banishedCards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card", card.color);
    cardEl.textContent = card.value;
    banishedDiv.appendChild(cardEl);
  });
}

/****************************************************
 * RENDERIZAR CARTA COMPRADA
 ****************************************************/
function renderBoughtCard() {
  const area = document.getElementById("boughtCardArea");
  area.innerHTML = "";

  if (!boughtCard) return;

  const cardEl = document.createElement("div");
  cardEl.classList.add("card", boughtCard.color);
  cardEl.textContent = boughtCard.value;
  cardEl.setAttribute("data-value", boughtCard.value);

  // Permite descartar a carta comprada diretamente
  cardEl.addEventListener("click", () => {
    discardBoughtCard();
  });

  area.appendChild(cardEl);
}

/****************************************************
 * COMPRAR CARTA
 ****************************************************/
function drawCard() {
  if (!gameStarted || gameEnded) return;

  // Se já tem uma carta comprada pendente, não pode comprar de novo
  if (boughtCard !== null) {
    alert("Você já comprou e não descartou ainda!");
    return;
  }

  if (deck.length === 0) {
    alert("O baralho acabou!");
    return;
  }

  // Puxa 1 carta pro boughtCard
  boughtCard = deck.pop();
  renderBoughtCard();
  document.getElementById("message").textContent =
    "Você comprou uma carta. Descarte uma da mão OU descarte a própria carta comprada.";
}

/****************************************************
 * DESCARTAR CARTA DA MÃO
 * (Ao clicar numa carta da mão)
 ****************************************************/
function discardCard(cardIndex) {
  if (!gameStarted || gameEnded) return;

  // Se não comprou nada (boughtCard===null), não pode descartar da mão
  if (!boughtCard) {
    alert("Você não tem carta comprada. Compre antes de descartar da mão!");
    return;
  }

  // Remove a carta escolhida da MÃO -> banidos
  const discarded = playerHand.splice(cardIndex, 1)[0];
  banishedCards.push(discarded);

  // Agora, insere a boughtCard na mão
  playerHand.push(boughtCard);
  boughtCard = null;

  renderBoughtCard();   // Remove a exibição
  renderHand();
  renderBanishedCards();

  // Se quiser checar
  checkWin();
}

/****************************************************
 * DESCARTAR A CARTA COMPRADA
 ****************************************************/
function discardBoughtCard() {
  if (!gameStarted || gameEnded) return;

  if (!boughtCard) {
    alert("Você não tem carta comprada para descartar!");
    return;
  }

  // Descarta a própria carta comprada
  banishedCards.push(boughtCard);
  boughtCard = null;

  renderBoughtCard();
  renderBanishedCards();
  document.getElementById("message").textContent =
    "Você descartou a carta comprada. Sua mão não mudou.";

  // Se quiser checar vitória (mão não mudou)
  checkWin();
}

/****************************************************
 * VERIFICAR SE PODE BATER (3/3/3 + 2)
 ****************************************************/
function checkWin() {
  if (!gameStarted || gameEnded) return;

  if (playerHand.length < 11) {
    document.getElementById("message").textContent =
      "Você não tem cartas suficientes para bater.";
    return false;
  }

  if (canMahjong([...playerHand])) {
    document.getElementById("message").textContent =
      "Parabéns! Você conseguiu bater (3/3/3/2)! Jogo encerrado.";
    gameEnded = true;

    // +25 pontos a cada vitória
    playerScore += 25;
    updateIAScoreStatus(); // Atualiza o texto “Faltam X pts” / “Liberada”

    return true;
  } else {
    document.getElementById("message").textContent =
      "Ainda não é possível bater.";
    return false;
  }
}

/****************************************************
 * updateIAScoreStatus: exibe quantos pontos faltam
 ****************************************************/
function updateIAScoreStatus() {
  const neededSpan = document.getElementById("scoreNeeded");
  const iaBtn = document.getElementById("btnSortVictory");

  if (playerScore >= 0) {
    neededSpan.textContent = "Liberada!";
    iaBtn.disabled = false;
    iaBtn.classList.remove("locked");
  } else {
    const falta = 0 - playerScore;
    neededSpan.textContent = `Faltam ${falta} pts`;
  }
}

/****************************************************
 * createClusters
 * Gera subgrupos de 3 (runs ou groups), leftover, etc.
 ****************************************************/
function createClusters(hand) {
  // Agrupa por cor -> detecta subsequências
  const colorMap = {};
  hand.forEach(card => {
    if (!colorMap[card.color]) colorMap[card.color] = [];
    colorMap[card.color].push(card);
  });
  let colorClusters = [];
  for (let color in colorMap) {
    let sortedC = colorMap[color].sort((a,b) => a.value - b.value);
    let sub = [sortedC[0]];
    for (let i = 1; i < sortedC.length; i++) {
      if (sortedC[i].value === sortedC[i-1].value + 1) {
        sub.push(sortedC[i]);
      } else {
        colorClusters.push([...sub]);
        sub = [sortedC[i]];
      }
    }
    if (sub.length) colorClusters.push([...sub]);
  }

  // Agrupa por valor -> detecta groups
  const valueMap = {};
  hand.forEach(card => {
    if (!valueMap[card.value]) valueMap[card.value] = [];
    valueMap[card.value].push(card);
  });
  let valueClusters = Object.values(valueMap);

  // Monta bigClusters >=3
  let bigClusters = [];
  let leftover = [...hand];

  // Sequences >=3 (fatias de 3)
  colorClusters.forEach(seq => {
    if (seq.length >= 3) {
      let howManyFull3 = Math.floor(seq.length / 3);
      for (let i = 0; i < howManyFull3; i++) {
        let chunk = seq.slice(i*3, i*3+3);
        bigClusters.push(chunk);
        chunk.forEach(c => {
          let idx = leftover.findIndex(x => x.color===c.color && x.value===c.value);
          if (idx!==-1) leftover.splice(idx,1);
        });
      }
    }
  });

  // Groups >=3
  valueClusters.forEach(gp => {
    if (gp.length >= 3) {
      let howManyFull3 = Math.floor(gp.length / 3);
      for (let i=0; i<howManyFull3; i++){
        let chunk = gp.slice(i*3, i*3+3);
        bigClusters.push(chunk);
        chunk.forEach(c => {
          let idx = leftover.findIndex(x=>x.color===c.color && x.value===c.value);
          if (idx!==-1) leftover.splice(idx,1);
        });
      }
    }
  });

  // Ordena bigClusters
  bigClusters.sort((a,b)=>b.length - a.length);

  // leftover -> 1 ou 2
  let finalClusters = [...bigClusters];
  leftover.forEach(card=>{
    finalClusters.push([card]);
  });

  return finalClusters;
}

/****************************************************
 * canMahjong: verif 3/3/3 + 2
 ****************************************************/
function canMahjong(hand) {
  // Ordena normal
  hand.sort((a, b) => {
    if (a.color === b.color) return a.value - b.value;
    return a.color.localeCompare(b.color);
  });

  function isRun(c) {
    return c.length===3
      && c[0].color===c[1].color && c[1].color===c[2].color
      && c[1].value===c[0].value+1
      && c[2].value===c[1].value+1;
  }
  function isGroup(c) {
    return c.length===3
      && c[0].value===c[1].value && c[1].value===c[2].value
      && c[0].color!==c[1].color && c[1].color!==c[2].color && c[0].color!==c[2].color;
  }
  function isPair(c) {
    return c.length===2 && c[0].value===c[1].value;
  }

  // Gera combos de 3
  let combos3=[];
  for (let i=0; i<hand.length-2;i++){
    for (let j=i+1;j<hand.length-1;j++){
      for (let k=j+1;k<hand.length;k++){
        combos3.push([i,j,k]);
      }
    }
  }

  function attempt(remaining, sets=0) {
    if (sets===3) {
      // sobrar par
      return (remaining.length===2 && isPair(remaining));
    }
    for (let combo of combos3) {
      let [x,y,z]=combo;
      if (x>=remaining.length||y>=remaining.length||z>=remaining.length) continue;
      let testSet=[remaining[x],remaining[y],remaining[z]].sort((a,b)=>a.value-b.value);
      if (isRun(testSet)||isGroup(testSet)) {
        let newRem=remaining.filter((_,idx)=>idx!==x&&idx!==y&&idx!==z);
        if (attempt(newRem, sets+1)) {
          return true;
        }
      }
    }
    return false;
  }

  return attempt(hand, 0);
}

/****************************************************
 * reasonNotBater: por que falhou
 ****************************************************/
function reasonNotBater(hand) {
  if (canMahjong(hand)) {
    return "Você já está em formato 3/3/3 + 2!";
  }
  let clusters=createClusters(hand);
  let tripleCount=0, pairCount=0, singleCount=0;
  clusters.forEach(arr=>{
    if (arr.length===3) tripleCount++;
    else if (arr.length===2) pairCount++;
    else if (arr.length===1) singleCount++;
  });
  if (tripleCount<3) {
    return `Faltam mais sets de 3. Você só tem ${tripleCount}.`;
  } else if (pairCount===0) {
    return `Falta um par. Você não formou par (sobras: ${singleCount} cartas).`;
  }
  return `Você quase conseguiu, algo sobrou em singles.`;
}

/****************************************************
 * chanceOfVictoryNextCard()
 ****************************************************/
function chanceOfVictoryNextCard() {
  if (deck.length===0) return {chance:0, reason:"Baralho acabou."};

  let possible=0, deckCount=deck.length;

  for (let i=0;i<deck.length;i++){
    let card=deck[i];
    let hypothetical=[...playerHand, card];
    if (canMahjong(hypothetical)) {
      possible++;
    }
  }
  let chance= possible/deckCount;
  let reason= `${possible} das ${deckCount} cartas possíveis te dariam vitória imediata.`;
  if (!possible) {
    reason= `Nenhuma das ${deckCount} cartas te faz bater agora. Continue tentando.`;
  }
  return {chance, reason};
}

/****************************************************
 * REAPLICAR ORDENACAO
 ****************************************************/
function reapplySort() {
  if (!gameStarted || gameEnded) return;
  if (selectedSort==="sequence") {
    sortBySequence(false);
  } else if (selectedSort==="group") {
    sortByGroup(false);
  } else if (selectedSort==="victory") {
    sortByVictoryPotential(false);
  }
}

/****************************************************
 * sortBySequence
 ****************************************************/
function sortBySequence(updateMethod=true) {
  if (!gameStarted||gameEnded) return;
  if (updateMethod) {
    currentSortMethod="sequence";
    selectedSort="sequence";
    activateSortButton("btnSortSequence");
  }
  // 1 e 9 prioridade, depois cor, depois valor
  playerHand.sort((a,b)=>{
    let isA19=(a.value===1||a.value===9);
    let isB19=(b.value===1||b.value===9);
    if (isA19&&!isB19) return -1;
    if (isB19&&!isA19) return 1;

    if (a.color<b.color) return -1;
    if (a.color>b.color) return 1;
    return a.value-b.value;
  });
  document.getElementById("message").textContent=
    "Organizado por Sequência (1 e 9 no início).";
  renderHand();
}

/****************************************************
 * sortByGroup
 ****************************************************/
function sortByGroup(updateMethod=true) {
  if (!gameStarted||gameEnded) return;
  if (updateMethod) {
    currentSortMethod="group";
    selectedSort="group";
    activateSortButton("btnSortGroup");
  }
  // 1 e 9 prioridade, depois valor, depois cor
  playerHand.sort((a,b)=>{
    let isA19=(a.value===1||a.value===9);
    let isB19=(b.value===1||b.value===9);
    if (isA19&&!isB19) return -1;
    if (isB19&&!isA19) return 1;

    if (a.value!==b.value) return a.value-b.value;
    return a.color.localeCompare(b.color);
  });
  document.getElementById("message").textContent=
    "Organizado por Grupo (1 e 9 no início).";
  renderHand();
}

/****************************************************
 * sortByVictoryPotential
 ****************************************************/
function sortByVictoryPotential(updateMethod=true) {
  if (!gameStarted||gameEnded) return;
  if (updateMethod) {
    currentSortMethod="victory";
    selectedSort="victory";
    activateSortButton("btnSortVictory");
  }
  // Gera clusters e agrupa no final
  let clusters=createClusters(playerHand);
  let finalOrder=[];
  clusters.forEach(cl=>{ finalOrder.push(...cl); });
  playerHand=finalOrder;

  document.getElementById("message").textContent=
    "Organizado por Potencial de Vitória (agrupando sets/sequências).";
  renderHand();
}

/****************************************************
 * Ativar/Desativar Botoes
 ****************************************************/
function activateSortButton(buttonId) {
  deactivateSortButtons();
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("active");
}

function deactivateSortButtons() {
  const switches = document.querySelectorAll(".sort-switch");
  switches.forEach(s=>s.classList.remove("active"));
}

/****************************************************
 * EVENT LISTENERS
 ****************************************************/
window.onload=()=>{
  // Botões iniciais
  document.getElementById("btnStart").addEventListener("click", startGame);
  document.getElementById("btnRestart").addEventListener("click", ()=>{
    resetGameState();
    document.getElementById("message").textContent=
      "Jogo reiniciado. Clique em 'Iniciar Jogo' para jogar novamente.";
  });

  // Botões de ação
  document.getElementById("btnDraw").addEventListener("click", drawCard);
  document.getElementById("btnCheckWin").addEventListener("click", checkWin);

  // Botões de organização
  document.getElementById("btnSortSequence").addEventListener("click", ()=>sortBySequence(true));
  document.getElementById("btnSortGroup").addEventListener("click", ()=>sortByGroup(true));
  document.getElementById("btnSortVictory").addEventListener("click", ()=>sortByVictoryPotential(true));

  // Modal de ajuda
  const btnHelp = document.getElementById("btnHelp");
  const helpModal = document.getElementById("helpModal");
  const closeModal = document.getElementById("closeModal");

  btnHelp.addEventListener("click", ()=>{
    helpModal.classList.remove("hidden");
  });
  closeModal.addEventListener("click", ()=>{
    helpModal.classList.add("hidden");
  });
  window.addEventListener("click",(event)=>{
    if (event.target===helpModal) {
      helpModal.classList.add("hidden");
    }
  });

  // Atualiza IA pontuação inicial
  updateIAScoreStatus();
};
