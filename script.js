/****************************************************
 * VARIÁVEIS GLOBAIS
 ****************************************************/
let deck = [];
let playerHand = [];
let banishedCards = [];
let gameStarted = false;
let gameEnded = false;

/****************************************************
 * FUNÇÃO: CRIAR BARALHO (UNO 1–9, 4 cores, 2 cópias)
 ****************************************************/
function createDeck() {
  const colors = ["red", "blue", "green", "yellow"];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let newDeck = [];

  for (let color of colors) {
    for (let num of numbers) {
      newDeck.push({ color, value: num });
      newDeck.push({ color, value: num });
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
 * INICIAR JOGO
 ****************************************************/
function startGame() {
  resetGameState();

  // O jogo começa com 10 cartas
  for (let i = 0; i < 10; i++) {
    playerHand.push(deck.pop());
  }

  document.getElementById("gameSection").classList.remove("hidden");
  document.getElementById("message").textContent = "Jogo iniciado! Boa sorte.";
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
  gameStarted = false;
  gameEnded = false;

  // Esconde a seção do jogo até clicar em "Iniciar Jogo"
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("message").textContent = "";
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

    // Ao clicar, tenta descartar
    cardEl.addEventListener("click", () => {
      discardCard(index);
    });
    handDiv.appendChild(cardEl);
  });
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

  banishedCards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card", card.color);
    cardEl.textContent = card.value;
    cardEl.setAttribute("data-value", card.value);
    banishedDiv.appendChild(cardEl);
  });
}

/****************************************************
 * COMPRAR CARTA
 ****************************************************/
function drawCard() {
  if (!gameStarted || gameEnded) return;

  // Se já tem 11 cartas, não pode comprar
  if (playerHand.length === 11) {
    alert("Você está com 11 cartas, precisa descartar antes de comprar!");
    return;
  }

  if (deck.length === 0) {
    alert("O baralho acabou! Não foi possível comprar.");
    return;
  }

  playerHand.push(deck.pop());
  renderHand();
  document.getElementById("message").textContent =
    "Você comprou uma carta. Agora pode descartar.";
}

/****************************************************
 * DESCARTAR CARTA
 ****************************************************/
function discardCard(cardIndex) {
  if (!gameStarted || gameEnded) return;

  // Se está com 10 cartas, não pode descartar (tem que comprar antes)
  if (playerHand.length === 10) {
    alert("Você está com 10 cartas, precisa comprar antes de descartar!");
    return;
  }

  // Agora pode descartar (com 11 cartas)
  const discarded = playerHand.splice(cardIndex, 1)[0];
  banishedCards.push(discarded); // Adiciona carta ao banimento
  document.getElementById("message").textContent = `Você descartou ${discarded.value} de ${discarded.color}.`;

  renderHand();
  renderBanishedCards();
}

/****************************************************
 * VERIFICAR BATER (3/3/3/2)
 ****************************************************/
function checkWin() {
  if (!gameStarted || gameEnded) return;

  const currentHand = [...playerHand];

  if (currentHand.length < 10) {
    document.getElementById("message").textContent =
      "Você não tem cartas suficientes para bater.";
    return;
  }

  if (canMahjong(currentHand)) {
    document.getElementById("message").textContent =
      "Parabéns! Você conseguiu bater (3/3/3/2)! Jogo encerrado.";
    gameEnded = true; // marca o fim do jogo
  } else {
    document.getElementById("message").textContent =
      "Ainda não é possível bater.";
  }
}

/****************************************************
 * canMahjong: lógica simples p/ 3/3/3 + 2
 ****************************************************/
function canMahjong(hand) {
  hand.sort((a, b) => {
    if (a.color === b.color) {
      return a.value - b.value;
    }
    return a.color.localeCompare(b.color);
  });

  function isRun(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.color === c2.color &&
      c2.color === c3.color &&
      c2.value === c1.value + 1 &&
      c3.value === c2.value + 1
    );
  }

  function isGroup(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.value === c2.value &&
      c2.value === c3.value &&
      c1.color !== c2.color &&
      c2.color !== c3.color &&
      c1.color !== c3.color
    );
  }

  function isPair(c) {
    return c.length === 2 && c[0].value === c[1].value;
  }

  // Gera combos de 3
  let combos3 = [];
  for (let i = 0; i < hand.length - 2; i++) {
    for (let j = i + 1; j < hand.length - 1; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        combos3.push([i, j, k]);
      }
    }
  }

  function attempt(remaining, sets = 0) {
    if (sets === 3) {
      if (remaining.length === 2 && isPair(remaining)) {
        return true;
      }
      return false;
    }
    for (let combo of combos3) {
      let [x, y, z] = combo;
      if (
        x >= remaining.length ||
        y >= remaining.length ||
        z >= remaining.length
      ) {
        continue;
      }
      let testSet = [remaining[x], remaining[y], remaining[z]].sort(
        (a, b) => a.value - b.value
      );
      if (isRun(testSet) || isGroup(testSet)) {
        let newRem = remaining.filter(
          (_, idx) => idx !== x && idx !== y && idx !== z
        );
        if (attempt(newRem, sets + 1)) {
          return true;
        }
      }
    }
    return false;
  }

  return attempt(hand, 0);
}

/****************************************************
 * NOVAS FUNÇÕES DE ORGANIZAÇÃO (Sequência / Grupo)
 ****************************************************/
function sortBySequence() {
  if (!gameStarted || gameEnded) return;

  // Prioriza 1 e 9
  playerHand = sortHandByPriority(playerHand);

  // Ordena por cor e valor
  playerHand.sort((a, b) => {
    if (a.color < b.color) return -1;
    if (a.color > b.color) return 1;
    return a.value - b.value;
  });
  renderHand();
  document.getElementById("message").textContent =
    "Organizado por Sequências (cor depois valor, com 1 e 9 no início).";
}

function sortByGroup() {
  if (!gameStarted || gameEnded) return;

  // Prioriza 1 e 9
  playerHand = sortHandByPriority(playerHand);

  // Ordena por valor e cor
  playerHand.sort((a, b) => {
    if (a.value === b.value) {
      return a.color.localeCompare(b.color);
    }
    return a.value - b.value;
  });
  renderHand();
  document.getElementById("message").textContent =
    "Organizado por Grupos (valor depois cor, com 1 e 9 no início).";
}

/****************************************************
 * FUNÇÃO PARA PRIORIZAR 1 E 9
 ****************************************************/
function sortHandByPriority(hand) {
  return hand.sort((a, b) => {
    if (a.value === 1 || a.value === 9) return -1;
    if (b.value === 1 || b.value === 9) return 1;
    return 0;
  });
}

/****************************************************
 * EVENT LISTENERS
 ****************************************************/
window.onload = () => {
  // Botão Iniciar Jogo
  document.getElementById("btnStart").addEventListener("click", startGame);

  // Botão Reiniciar Jogo (Reset total)
  document.getElementById("btnRestart").addEventListener("click", () => {
    resetGameState();
    document.getElementById("message").textContent =
      "Jogo reiniciado. Clique em 'Iniciar Jogo' para jogar novamente.";
  });

  // Botões de ação do jogo
  document.getElementById("btnDraw").addEventListener("click", drawCard);
  document.getElementById("btnCheckWin").addEventListener("click", checkWin);
  document.getElementById("btnSortSequence").addEventListener("click", sortBySequence);
  document.getElementById("btnSortGroup").addEventListener("click", sortByGroup);

  // Modal de ajuda
  const btnHelp = document.getElementById("btnHelp");
  const helpModal = document.getElementById("helpModal");
  const closeModal = document.getElementById("closeModal");

  // Abrir modal
  btnHelp.addEventListener("click", () => {
    helpModal.classList.remove("hidden");
  });

  // Fechar modal ao clicar no "X"
  closeModal.addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });

  // Fechar modal clicando no fundo
  window.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      helpModal.classList.add("hidden");
    }
  });
};
