let automaton;
let network;

// Initialize an automaton instance (DFA or NFA) based on user selection.
function initializeAutomaton() {
  const selectedType = document.getElementById("automatonType").value;

  switch (
    selectedType // Dropdown sa HTML, choose between NFA or DFA
  ) {
    case "DFA":
      automaton = new DFA(); // New instance DFA.js
      break;
    case "NFA": // New instance NFA.js
      automaton = new NFA();
      break;
    default:
      throw new Error(`Unknown automaton type: ${selectedType}`);
  }

  // Reset all elements on the screen
  const stateListElement = document.getElementById("stateList"); // WHY RESET???
  if (stateListElement) {
    // BRUH, different FSM, reset data, less hassle
    stateListElement.innerHTML = "";
  }
  const transitionListElement = document.getElementById("transitionList");
  if (transitionListElement) {
    transitionListElement.innerHTML = "";
  }
  document.getElementById("result").textContent = "";
  document.getElementById("testString").value = "";
  resetStateForm();

  // Initialize nodes and edges as empty DataSets
  nodes = new vis.DataSet(); // Empty DataSet for nodes
  edges = new vis.DataSet(); // Empty DataSet for edges
  edgeOffsets = {}; // To handle edge offsets for self-loops

  // Prepare data object for vis.Network
  const data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {};
  // Initialize the network
  const container = document.getElementById("network");
  network = new vis.Network(container, data, options);

  // Call update functions directly
  updateStateList();
  updateTransitionList();
}

// Adds a new state to the automaton instance.
function addState() {
  const stateName = document.getElementById("stateName").value.trim();
  const isStartState = document.getElementById("startState").checked;
  const isAcceptState = document.getElementById("acceptState").checked;

  // Check for empty state name
  if (stateName === "") {
    alert("State name cannot be empty.");
    return;
  }

  // Add state to the automaton instance and update the state list
  automaton.addState(stateName, isStartState, isAcceptState);
  updateStateList();

  // Update the result display
  document.getElementById("result").textContent = `State ${stateName} added.`;

  // Add the state as a node in the graph
  nodes.add({
    id: stateName, // Use stateName as the ID
    label: stateName,
    shape: "circle",
    color: {
      background:
        isStartState && isAcceptState
          ? "#8E24AA" // Purple for start+accept
          : isStartState
          ? "#5C6BC0" // Indigo for start
          : isAcceptState
          ? "#43A047" // Green for accept
          : "#616161", // Grey for regular
      border: "#ffffff", // White border for better contrast on dark grid
      highlight: {
          background: "#FFD54F", // Amber for highlight
          border: "#ffffff"
      }
    },
    font: {
      size: 20,
      face: "Poppins",
      color: "#ffffff",
      align: "center",
      vadjust: -1 // Slight adjustment to center vertical
    },
    physics: false,
    size: isAcceptState ? 30 : 25, // Larger size for accept states
    borderWidth: isAcceptState ? 3 : 2, // Thicker border for accept states
  });

  // // Reset the state form to its original state
  resetStateForm();
}

// Resets the state form to its original state.
function resetStateForm() {
  // Clear the state name input
  const stateNameField = document.getElementById("stateName");
  stateNameField.value = "";

  // Uncheck the start state and accept state checkboxes
  const startStateCheckbox = document.getElementById("startState");
  startStateCheckbox.checked = false;

  const acceptStateCheckbox = document.getElementById("acceptState");
  acceptStateCheckbox.checked = false;
}

// Adds a transition to the automaton (either NFA or DFA) based on user input.
function addTransition() {
  const fromState = document.getElementById("fromState").value.trim();
  const symbol = document.getElementById("symbol").value.trim();
  const toStateInput = document.getElementById("toState").value.trim();

  const isNFA = automaton instanceof NFA;
  const transitionSymbol = symbol || (isNFA ? "ε" : ""); // Use epsilon for NFA, enforce symbol for DFA

  // Check of From and To are not empty
  if (!fromState || !toStateInput) {
    alert("Both 'From State' and 'To State' must be provided.");
    return;
  }

  // Ensure DFA transitions have a valid symbol
  if (!isNFA && !transitionSymbol) {
    alert("A valid symbol is required for DFA transitions.");
    return;
  }

  // Parse 'To States' for NFA or single 'To State' for DFA
  const toStates = toStateInput.split(",").map((state) => state.trim());
  const targetState = isNFA ? toStates : toStates[0];

  // Handle DFA transitions: Check for duplicate symbols for the same fromState
  if (!isNFA) {
    // Check if a transition for this symbol already exists in the DFA
    const existingTransition =
      automaton.transitions[fromState] &&
      automaton.transitions[fromState][transitionSymbol];
    if (existingTransition) {
      alert(
        `Transition already exists for state ${fromState} with symbol ${transitionSymbol}.`
      );
      return;
    }
  }

  // Add the transition to the automaton instance
  automaton.addTransition(fromState, transitionSymbol, targetState);

  // Update the transition list UI
  updateTransitionList();
  document.getElementById(
    "result"
  ).textContent = `Transition added: ${fromState} --${transitionSymbol}--> ${toStates.join(
    ", "
  )}`;

  // Reset transition form inputs
  document.getElementById("fromState").value = "";
  document.getElementById("symbol").value = "";
  document.getElementById("toState").value = "";

  // Handle self-loop
  const isSelfLoop = fromState === toStateInput;

  // Initialize edge offset for self-loop handling
  if (!edgeOffsets[fromState]) edgeOffsets[fromState] = {};
  if (!edgeOffsets[fromState][toStateInput])
    edgeOffsets[fromState][toStateInput] = 0;

  const offset = edgeOffsets[fromState][toStateInput]++;
  const transitionLength = isSelfLoop ? 250 + offset * 100 : 250;

  // Add edge(s) for NFA transitions
  if (isNFA) {
    toStates.forEach((state) => {
      edges.add({
        from: fromState,
        to: state,
        label: transitionSymbol,
        arrows: "to",
        color: { color: "#e0e0e0", highlight: "#FFD54F" },
        smooth: {
          type: isSelfLoop ? "cubicBezier" : "continuous",
          roundness: isSelfLoop ? 0.6 : 0.4,
        },
        font: { align: "horizontal", face: "Poppins", color: "#ffffff", strokeWidth: 0 },
        physics: false,
        length: transitionLength,
      });
    });
  } else {
    // For DFA, only one 'toState'
    edges.add({
      from: fromState,
      to: targetState,
      label: transitionSymbol,
      arrows: "to",
      color: { color: "#e0e0e0", highlight: "#FFD54F" },
      smooth: {
        type: isSelfLoop ? "cubicBezier" : "continuous",
        roundness: isSelfLoop ? 0.6 : 0.4,
      },
      font: { align: "horizontal", face: "Poppins", color: "#ffffff", strokeWidth: 0 },
      physics: false,
      length: transitionLength,
    });
  }
}

// Updates the state list UI with the current states of the automaton.
function updateStateList() {
  const stateTableBody = document.querySelector("#stateTable tbody");
  stateTableBody.innerHTML = ""; // Clear existing rows

  automaton.states.forEach((state) => {
    const row = document.createElement("tr");

    const stateCell = document.createElement("td");
    stateCell.textContent = state;

    const typeCell = document.createElement("td");
    const types = [];
    if (state === automaton.startState) types.push("Start");
    if (automaton.acceptStates.has(state)) types.push("Accept");
    typeCell.textContent = types.join(", ") || "Normal";

    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-btn"); // Add class for styling if needed
    deleteButton.onclick = () => {
      // Call a function to remove the state from the automaton
      removeState(state);
    };
    deleteCell.appendChild(deleteButton);

    row.appendChild(stateCell);
    row.appendChild(typeCell);
    row.appendChild(deleteCell);

    stateTableBody.appendChild(row);
  });
}

function updateTransitionList() {
  const transitionTableBody = document.querySelector("#transitionTable tbody");
  transitionTableBody.innerHTML = ""; // Clear existing rows

  for (const fromState in automaton.transitions) {
    for (const symbol in automaton.transitions[fromState]) {
      const toStates = Array.isArray(automaton.transitions[fromState][symbol])
        ? automaton.transitions[fromState][symbol]
        : [automaton.transitions[fromState][symbol]];

      toStates.forEach((toState) => {
        const row = document.createElement("tr");

        const fromCell = document.createElement("td");
        fromCell.textContent = fromState;

        const symbolCell = document.createElement("td");
        symbolCell.textContent = symbol;

        const toCell = document.createElement("td");
        toCell.textContent = toState;

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-btn"); // Add class for styling if needed
        deleteButton.onclick = () => {
          // Call a function to remove the transition from the automaton
          removeTransition(fromState, symbol, toState);
        };
        deleteCell.appendChild(deleteButton);

        row.appendChild(fromCell);
        row.appendChild(symbolCell);
        row.appendChild(toCell);
        row.appendChild(deleteCell);

        transitionTableBody.appendChild(row);
      });
    }
  }
}

function removeState(state) {
  if (automaton.states.has(state)) {
    automaton.acceptStates.delete(state);
    automaton.startState = null;
    automaton.states.delete(state);
    nodes.remove({ id: state });
  }

  updateStateList();
  updateTransitionList(); // Update transition list to remove transitions related to the deleted state
}

function removeTransition(fromState, symbol, toState) {
  if (
    automaton.transitions[fromState] &&
    automaton.transitions[fromState][symbol]
  ) {
    const toStates = Array.isArray(automaton.transitions[fromState][symbol])
      ? automaton.transitions[fromState][symbol]
      : [automaton.transitions[fromState][symbol]];
    const filteredToStates = toStates.filter((s) => s !== toState);
    if (filteredToStates.length === 0) {
      delete automaton.transitions[fromState][symbol];
      if (Object.keys(automaton.transitions[fromState]).length === 0) {
        delete automaton.transitions[fromState];
      }
    } else {
      automaton.transitions[fromState][symbol] = filteredToStates;
    }
  }

  // Remove the edge from the vis.js network
  const edgesToRemove = edges.get({
    filter: (edge) =>
      edge.from === fromState && edge.to === toState && edge.label === symbol,
  });

  // Remove each matching edge
  edgesToRemove.forEach((edge) => {
    edges.remove(edge);
  });

  updateTransitionList();
}

// Resets the node and edge colors to their default states.
function resetGraphColors() {
  // Reset nodes to default color
  const networkNodes = network.body.data.nodes;
  networkNodes.forEach((node) => {
    const state = node.id;

    let backgroundColor = "#616161"; // Default Grey
    let borderColor = "#ffffff"; // White border

    if (state === automaton.startState && automaton.acceptStates.has(state)) {
      backgroundColor = "#8E24AA"; // Purple
    } else if (state === automaton.startState) {
      backgroundColor = "#5C6BC0"; // Indigo
    } else if (automaton.acceptStates.has(state)) {
      backgroundColor = "#43A047"; // Green
    }

    // Reset node properties
    networkNodes.update({
      id: state,
      color: {
        background: backgroundColor,
        border: borderColor,
        highlight: {
            background: "#FFD54F",
            border: "#ffffff"
        }
      },
      font: {
        color: "#ffffff"
      },
      borderWidth: automaton.acceptStates.has(state) ? 3 : 2,
      size: automaton.acceptStates.has(state) ? 30 : 25,
    });
  });

  // Reset edges to default color
  const networkEdges = network.body.data.edges;
  networkEdges.forEach((edge) => {
    networkEdges.update({
      id: edge.id,
      color: {
        color: "#e0e0e0", // Lighter gray for visibility
        highlight: "#FFD54F"
      },
      width: 1, // Default width
    });
  });
}

function simulateWithAnimation(input) {
  // Verify if automaton is initialized
  if (!automaton) {
    alert("Automaton not initialized.");
    return;
  }

  // Finds all states connected to the initial states.
  // For NFAs, this includes computing the epsilon closure (states reachable via ε-transitions).
  // For DFAs, this simply identifies reachable states without ε-transitions.
  function getEpsilonClosure(initialStates) {
    const closure = new Set(initialStates); // Tracks all connected states (including ε-closure for NFAs).
    const stack = [...initialStates]; // Stack to perform depth-first search.
    const epsilonPath = []; // Records ε-transitions (used in NFAs, empty for DFAs).

    // Explore all reachable states using depth-first search.
    while (stack.length > 0) {
      const state = stack.pop();

      // For NFAs, check for ε-transitions from the current state.
      if (automaton.transitions[state] && automaton.transitions[state]["ε"]) {
        const epsilonTransitions = automaton.transitions[state]["ε"];
        const newStates = Array.isArray(epsilonTransitions)
          ? epsilonTransitions
          : [epsilonTransitions];

        newStates.forEach((epsilonState) => {
          if (!closure.has(epsilonState)) {
            closure.add(epsilonState); // Add new state to closure.
            stack.push(epsilonState); // Continue exploring from the new state.
            epsilonPath.push({ from: state, to: epsilonState }); // Record the ε-transition for visualization.
          }
        });
      }
    }

    // Return reachable states (closureStates) and ε-transitions (epsilonPath).
    // For DFAs, epsilonPath will always be empty.
    return { closureStates: Array.from(closure), epsilonPath: epsilonPath };
  }

  if (input.length === 0) {
    // Handle empty input (interpreted as ε).
    const { closureStates, epsilonPath } = getEpsilonClosure([
      automaton.startState,
    ]);

    function animateEpsilonTransitions(pathIndex = 0) {
      const resultElement = document.getElementById("result");
      // Animate ε-transitions for NFAs.
      if (pathIndex >= epsilonPath.length) {
        // Termination condition: all ε-transitions have been animated.
        const isAccepted = closureStates.some((state) =>
          automaton.acceptStates.has(state)
        );
        resultElement.textContent = isAccepted
          ? "✅ Accepted (Empty String)"
          : "❌ Rejected (Empty String)";
        resultElement.className = isAccepted ? "status-accepted" : "status-rejected";
        highlightState(closureStates, [], "ε"); // Highlight all states in the ε-closure.
        resetGraphColors(); // Reset graph colors after simulation.
        return;
      }

      const { from, to } = epsilonPath[pathIndex]; // Get the current ε-transition.

      // Display the transition and animate the graph.
      resultElement.textContent = `ε-transition: ${from} → ${to}`;
      resultElement.className = "";
      highlightState([from], [to], "ε");

      // Delay before animating the next ε-transition.
      setTimeout(() => {
        animateEpsilonTransitions(pathIndex + 1);
      }, 1000); // 1-second delay per ε-transition.
    }

    animateEpsilonTransitions();
    return;
  }

  let currentStates = [automaton.startState]; // Current states being processed.
  let currentIndex = 0; // Current step in the input string.

  // Function to animate a single simulation step.
  function animateStep() {
    const resultElement = document.getElementById("result");
    
    if (currentIndex >= input.length) {
      // Termination condition: all input symbols processed.
      const isAccepted = currentStates.some((state) =>
        automaton.acceptStates.has(state)
      );
      
      resultElement.textContent = isAccepted ? "✅ Accepted" : "❌ Rejected";
      resultElement.className = isAccepted ? "status-accepted" : "status-rejected";
      
      resetGraphColors(); // Reset graph colors after simulation.
      return;
    }

    const symbol = input[currentIndex]; // Get the current symbol.

    function performEpsilonClosureAndTransition() {
      // Compute ε-closure for current states (important for NFAs).
      const { closureStates, epsilonPath } = getEpsilonClosure(currentStates);

      function animateEpsilonTransitions(pathIndex = 0) {
        // Animate ε-transitions before processing the symbol.
        if (pathIndex >= epsilonPath.length) {
          processSymbol(closureStates); // Process the symbol after ε-transitions.
          return;
        }

        const { from, to } = epsilonPath[pathIndex];

        // Display the ε-transition and update the graph.
        resultElement.textContent = `ε-transition: ${from} → ${to}`;
        resultElement.className = ""; // Reset class during processing
        highlightState([from], [to], "ε");

        // Delay before animating the next ε-transition.
        setTimeout(() => {
          animateEpsilonTransitions(pathIndex + 1);
        }, 1000);
      }

      animateEpsilonTransitions();
    }

    function processSymbol(closureStates) {
      // Process the current symbol and determine the next states.
      const nextStates = [];

      closureStates.forEach((state) => {
        if (
          automaton.transitions[state] &&
          automaton.transitions[state][symbol]
        ) {
          const transitionTargets = automaton.transitions[state][symbol];
          const targets = Array.isArray(transitionTargets)
            ? transitionTargets
            : [transitionTargets];
          nextStates.push(...targets); // Add all reachable states for the current symbol.
        }
      });

      if (nextStates.length === 0) {
        // No valid transitions for the current symbol.
        resultElement.textContent = `❌ Rejected: No transition for ${symbol} from states ${closureStates.join(
          ", "
        )}`;
        resultElement.className = "status-rejected";
        resetGraphColors(); // Reset graph colors on rejection.
        return;
      }

      // Compute ε-closure for the next states (important for NFAs).
      const {
        closureStates: nextClosureStates,
        epsilonPath: nextClosureTransitions,
      } = getEpsilonClosure(nextStates);

      // Display the transition and update the graph.
      resultElement.textContent = `Processing Symbol: ${symbol} (${closureStates.join(
        ", "
      )} → ${nextClosureStates.join(", ")})`;
      resultElement.className = ""; // Reset class
      highlightState(
        closureStates,
        nextClosureStates,
        symbol,
        nextClosureTransitions
      );

      // Update current states and proceed to the next step.
      currentStates = nextClosureStates;
      currentIndex++;

      setTimeout(animateStep, 1000); // Delay before processing the next symbol.
    }

    performEpsilonClosureAndTransition();
  }

  animateStep();
}

// Animates the graph by recoloring states and transitions for a simulation step.
function highlightState(
  currentStates,
  nextStates,
  transitionSymbol,
  epsilonTransitions = []
) {
  const networkNodes = network.body.data.nodes; // Access graph nodes.
  networkNodes.forEach((node) => {
    const state = node.id;

    // Determine the node's color based on its role in the simulation.
    let backgroundColor = "#616161"; // Default
    if (currentStates.includes(state)) {
      backgroundColor = "#FFD54F"; // Amber for current
    } else if (nextStates.includes(state)) {
      backgroundColor = "#4DB6AC"; // Teal for next
    } else if (
      state === automaton.startState &&
      automaton.acceptStates.has(state)
    ) {
      backgroundColor = "#8E24AA"; // Purple
    } else if (state === automaton.startState) {
      backgroundColor = "#5C6BC0"; // Indigo
    } else if (automaton.acceptStates.has(state)) {
      backgroundColor = "#43A047"; // Green
    }

    let borderColor = "#ffffff"; // Default border
    
    networkNodes.update({
      id: state,
      color: {
        background: backgroundColor,
        border: borderColor,
      },
      borderWidth: automaton.acceptStates.has(state) ? 3 : 2,
      size:
        currentStates.includes(state) ||
        nextStates.includes(state) ||
        automaton.acceptStates.has(state)
          ? 30
          : 25,
    });
  });

  const networkEdges = network.body.data.edges; // Access graph edges.
  networkEdges.forEach((edge) => {
    const isActiveTransition =
      (currentStates.includes(edge.from) &&
        nextStates.includes(edge.to) &&
        edge.label === transitionSymbol) ||
      (edge.label === "ε" &&
        epsilonTransitions.some(
          (transition) =>
            transition.from === edge.from && transition.to === edge.to
        ));

    networkEdges.update({
      id: edge.id,
      color: { color: isActiveTransition ? "#FFD54F" : "#e0e0e0" }, // Highlight color vs Default
      width: isActiveTransition ? 3 : 1,
    });
  });
}

function simulate() {
  const testString = document.getElementById("testString").value.trim();
  simulateWithAnimation(testString);
}

initializeAutomaton();
