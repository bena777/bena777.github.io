class MarkovChain{
    constructor(){
        this.names = [];
        this.current = "";
        this.indexs = new Map();
        this.markov_adj =[[]];
        this.dist = new Map();
        this.start;
    }

    init_chain(start,namess, probs){
        this.start = start;
        for(let i=0; i < namess.length; i++){
            this.indexs.set(namess[i], i);
            this.dist.set(namess[i],0);
        }
        for(let vec of probs){
            let sum = 0;
            for(let i of vec){
                sum+=i;
            }
            if(Math.abs(sum-1) >= 0.0001){
                console.log("invalid matrix, a row does not add to 1");
                return false;
            }
        }
        this.markov_adj = probs;
        this.names = namess;
        this.current = start;
        // this.dist.set(start,this.dist.get(start)+1);
    }

    randomChoice(arr, probabilities) {
        const rand = Math.random();
        let cumulativeProb = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProb += probabilities[i];
            if (rand < cumulativeProb) {
                return arr[i];
            }
        }
    }


    run_nodes(n){
        let path = [this.current];
        for (let i = 0; i < n; i++) {
            let row = this.markov_adj[this.indexs.get(this.current)];
            this.current = this.randomChoice(this.names, row);
            path.push(this.current);
            this.dist.set(this.current,this.dist.get(this.current)+1);
        }
        return path;
    }

    find_least_prob_path(start,end){
        const S = new Set();
        const VS = new Set();
        const d = {};
        const p = {};

        S.add(start);
        d[start] = 0;
        p[start] = " "; 
        for (const [state, _] of this.indexs.entries()) {
            if (state !== start) {
                VS.add(state);
                d[state] = 9999;
                p[state] = " ";
            }
        }

        for (const v of VS) {
            p[v] = start;
            const prob = this.markov_adj[this.indexs.get(start)][this.indexs.get(v)];
            if (prob > 0.0) {
                d[v] = prob;
            } else {
                d[v] = 9999;
            }
        }

        while (VS.size > 0) {
            let smallest = null;
            let smallestWeight = 9999;

            for (const v of VS) {
                if (d[v] < smallestWeight) {
                    smallest = v;
                    smallestWeight = d[v];
                }
            }

            if (smallest === null) break;

            VS.delete(smallest);
            S.add(smallest);

            for (const v of VS) {
                const prob = this.markov_adj[this.indexs.get(smallest)][this.indexs.get(v)];
                if (prob > 0) {
                    const alt = d[smallest] * prob;
                    if (alt < d[v]) {
                        d[v] = alt;
                        p[v] = smallest;
                    }
                }
            }
        }
        
        let path = [end];
        let curr = end;
        while(p[curr] != " "){
            path.push(p[path.at(-1)])
            curr = p[curr];
        }
        // console.log("Lowest probability paths for", start);
        // for (const state in p) {
            // console.log(`${state} | ${p[state]} | ${d[state]}`);
        // }
        return path.reverse();
    }
}

let markovChain = new MarkovChain();
let n = 0;
data = {};
let stop = true;
let run_button;
let recent_nodes = document.createElement("span");
let recent = [];
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function next_state() {
    markovChain.run_nodes(1);
    states = [];
    while(!stop){
        let speed = document.getElementById("speed_slider").value;
        markovChain.run_nodes(1);
        states.push(markovChain.current);
        data.nodes.update({
            id: parseInt(markovChain.indexs.get(markovChain.current)),
            color: "green"
        })
        recent.push(markovChain.current);
        await sleep(Math.pow(speed,3));
        data.nodes.update({
            id: parseInt(markovChain.indexs.get(markovChain.current)),
            color: "blue"
        })
        let text = document.getElementById(markovChain.current + "_count"); // need to fix first element of recency list staying in 
        text.textContent = parseInt(markovChain.dist.get(markovChain.current));
        let recent_text = "last 10: ";
        const att =  Math.min(recent.length,10);
        for(let i = 1; i < att+1; i++){
            recent_text = recent_text + recent.at(-i) + " ";
        }
        recent_nodes.textContent = recent_text;

        const trace = {
            x: Array.from(markovChain.dist.keys()),
            y: Array.from(markovChain.dist.values()),
            type: 'bar'
        };
        histo = {
            title: {
                text: "Chain Distribution"
            },
            xaxis: { title: 'State', type: "Category"},
            yaxis: { title: 'Visits' }
        };
        Plotly.newPlot('histo_plot',[trace],histo,{staticPlot: false});
    }
    stop = true;
    data.nodes.update({
        id: parseInt(markovChain.indexs.get(markovChain.current)),
        color: "blue"
    })
}

function draw_markov_chain(names, transition){
    stop = true;
    const nodes = names.map((name, index) => ({
        id: index,
        label: name
    }));

    const edges = [];
    for (let i = 0; i < transition.length; i++) {
        for (let j = 0; j < transition[i].length; j++) {
            const weight = transition[i][j];
            if (weight > 0) {
                edges.push({
                    from: i,
                    to: j,
                    label: weight.toFixed(2),
                    arrows: "to"
                });
            }
        }
    }
    const container = document.getElementById("network");
    data = {nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = {
        edges: {
            smooth: true,
            arrows: { to: { enabled: true, scaleFactor: 1 } },
            color: "#000000"
        },
        nodes: {
            shape: "ellipse",
            font: { size: 16 },
            color: "blue"
        },
        physics: { enabled: false }
    };
    new vis.Network(container, data, options);
    run_button = document.createElement("button");
    run_button.textContent = "run";
    run_button.id = "run_button";
    run_button.addEventListener("click", () => {
        if (stop) {
            stop = false;
            run_button.textContent = "stop";
            next_state();
        } else {
            stop = true;
            run_button.textContent = "run";
        }
    });

    container.appendChild(run_button);

    const least_prob_path_button = document.createElement("button");
    least_prob_path_button.textContent = "find least prob path";
    least_prob_path_button.id = "least_prob_button";

    container.appendChild(run_button);
    container.appendChild(least_prob_path_button);
    const countsContainer = document.createElement("div");
    countsContainer.style.display = "flex";
    countsContainer.style.gap = "20px";
    countsContainer.style.marginTop = "20px";

    for (let i of names) {
        const countWrapper = document.createElement("div");
        countWrapper.style.display = "flex";
        countWrapper.style.flexDirection = "column";
        countWrapper.style.alignItems = "center";

        const label = document.createElement("span");
        label.textContent = i;
        label.style.fontWeight = "bold";

        const count = document.createElement("span");
        count.textContent = "0";
        count.id = i + "_count";
        count.style.fontSize = "18px";

        countWrapper.appendChild(label);
        countWrapper.appendChild(count);
        countsContainer.appendChild(countWrapper);
    }

    container.appendChild(countsContainer);

    recent_nodes.id = "recent_nodes";
    recent_nodes.textContent = "";
    container.appendChild(recent_nodes);

    histo = {
        x:names,
        y:[0].flatMap(el => Array(names.size).fill(el)),
        title: {
            text: "Chain Distribution"
        },
        type: 'histogram',
        xaxis: { title: 'State' },
        yaxis: { title: 'Visits' }
    };
    Plotly.newPlot('histo_plot',histo);
}

function check_matrix_input(){
    let valid = true;
    let transition = [];
    let names = [];
    for(let i=0; i < n; i++){
        let sum = 0;
        let cur = []
        for(let j=0; j < n; j++){
            let cell = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
            sum += cell;
            cur.push(cell);
        }
        if(Math.abs(sum-1) >= 0.0001){
            console.log(sum);
            valid = false;
        }
        transition.push(cur);
        names.push(document.getElementById(`name-${i}`).value)
    }
    name_set = new Set(names);
    too_long = false;
    for(let i of names){
        if(i.length > 10){
            too_long = true;
        }
    }
    
    if(!valid){
        document.getElementById("matrix_error").textContent = "Invalid matrix, rows must add to 1";
    } else if(name_set.size != names.length){
        document.getElementById("matrix_error").textContent = "Invalid matrix, names must all be unique";
    } else if(too_long){
        document.getElementById("matrix_error").textContent = "Invalid name, name is longer than 10 characters";
    }else{
        document.getElementById("matrix_error").textContent = "";
        markovChain = new MarkovChain();
        markovChain.init_chain(names[0],names,transition);
        draw_markov_chain(names,transition);
        markovChain.find_least_prob_path(names.at(0),names.at(-1));
    }
}


function make_matrix_input() {
    n = parseInt(document.getElementById("number").value);
    const container = document.getElementById("matrixContainer");
    container.innerHTML = "";
    const table = document.createElement("table");

    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
        const cell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.id = `name-${j}`;
        cell.appendChild(input);
        row.appendChild(cell);
    }
    table.appendChild(row);
    for (let i = 0; i < n; i++) {
        row = document.createElement("tr");
        for (let j = 0; j < n; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.value = ""+1/n;
            input.min = "0";
            input.max = "1";
            input.step = "0.01";
            input.id = `cell-${i}-${j}`;
            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    container.appendChild(table);
    const chain_button = document.createElement("button");
    chain_button.textContent = "Finalize Chain";
    chain_button.id = "chain_button";
    chain_button.addEventListener("click", function() {
        check_matrix_input();
        recent_nodes.textContent = "";
    });
    container.append(chain_button);
}