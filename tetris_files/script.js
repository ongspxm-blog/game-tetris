// === utils funcs
function $(id) {
    return document.getElementById(id);
}

function $$(tag) {
    return document.createElement(tag);
}

function cell(idx) {
    return `cell${idx}`;
}

function activateRC(row, col, turnOn=true) {
    return activate(row*gameW + col, turnOn);
}

function activate(idx, turnOn=true) {
    gdata.grid[idx] = turnOn;
    $(cell(idx)).className = turnOn
        ? 'active' : '';

    return true;
}

// === global vars
const fps = 60;
const gameW = 12;
const gameH = 20;
let timer;

// NOTE: shape is a 16 char string, representing a 4x4 grid
const shapes = [
    [ '1100110000000000', '1100110000000000',
    '1100110000000000', '1100110000000000' ],
    [ '1000100010001000', '0000111100000000',
    '1000100010001000', '0000111100000000' ],
    [ '0100111000000000', '1000110010000000',
    '1110010000000000', '0100110001000000' ],
    [ '1100011000000000', '0100110010000000',
    '1100011000000000', '0100110010000000' ],
    [ '0110110000000000', '1000110001000000',
    '0110110000000000', '1000110001000000' ],
    [ '1110001000000000', '0100010011000000',
    '1000111000000000', '1100100010000000' ],
    [ '11101000000000000', '1100010001000000',
    '0010111000000000', '1000100011000000' ]
];

const gdata = {
    time: 0,
    mtime: 0,
    dirId: 0,
    shapeId: 5,
    y: 0, x: 5,
    grid: [],
};

// === game functions
function doAction(action, undo) {
    // NOTE: undo() is the opposite of action()
    // returns true/false depending on whether action is taken

    print(false); action();
    const valid = validmove();
    if (!valid) { undo(); }

    print(); return valid;
}

function traceShape(action) {
    // NOTE: action returns true/false based on
    // whether action(row, col) is taken
    const shape = shapes[gdata.shapeId][gdata.dirId];

    let valid = true;
    for (let r=0; r<4; r++) {
        for (let c=0; c<4; c++) {
            if (shape[r*4+c]=='1') {
                valid = valid && action(r, c);
            }
        }
    }

    return valid;
}

function print(turnOn=true) {
    // NOTE: assumes whole shape within grid,
    // and valid to print
    traceShape((r, c) => activateRC(
        gdata.y+r, gdata.x+c, turnOn));
}

function validmove() {
    return traceShape((r, c) => {
        const y2 = gdata.y + r;
        const x2 = gdata.x + c;

        if ( y2<0 || y2>=gameH
            || x2<0 || x2>=gameW
            || gdata.grid[y2*gameW + x2] ) {
            return false;
        }
        return true;
    }); 
}

function redrawGrid() {
    for (let r=0; r<gameH; r++) {
        for (let c=0; c<gameW; c++) {
            activateRC(r, c, gdata.grid[r*gameW + c]);
        }
    } 
}

function clearRows() {
    // NOTE: returns score for this turn
    
    let row = 0;
    let count = 0;
    for (let r=0; r<gameH; r++) {
        let valid = true;
        for (let c=0; c<gameW; c++) {
            valid = valid && gdata.grid[row*gameW + c];
        }

        if (valid) {
            count += 1;
            gdata.grid = gdata.grid.slice(0, row*gameW)
                .concat(gdata.grid.slice((row+1)*gameW)); 
        } else { row += 1; }
    }

    for (let i=0; i<count*gameW; i++) {
        gdata.grid.unshift(false);
    }

    let score = count;
    for (let c=0; c<count; c++) {
        score += c;
    }

    redrawGrid();
    return score;
}

// === main game endpoints
function start() {
    const game = $('game');
    gdata.time = 0;
    gdata.score = 0;

    for (let h=0; h<gameH; h++) {
        const tr = $$('tr');
        game.appendChild(tr);

        for (let r=0; r<gameW; r++) {
            const td = $$('td');
            td.id = cell(h*gameW + r);
            tr.appendChild(td);
        }
    }

    for (let i=0; i<gameH*gameW; i++) {
        gdata.grid.push(false);
    }

    update();
}

function update() { 
    gdata.time += fps;

    switch (gdata.kpress) {
        case 1:
            doAction(() => { gdata.x -= 1; },
                () => { gdata.x += 1; });
            break;
        case 2:
            doAction(() => { gdata.x += 1; },
                () => { gdata.x -= 1; });
            break;
        case 3:
            doAction(() => { gdata.dirId = (gdata.dirId+1)%4; },
                () => { gdata.dirId = (gdata.dirId-1)%4; });
            break;
        case 4:
            doAction(() => { gdata.y += 1; },
                () => { gdata.y -= 1; });
            break;
    }
    gdata.kpress = 0;

    if (gdata.time > 1000/((gdata.score/10)+1)) {
        gdata.time = 0;

        const valid = doAction(
            () => { gdata.y += 1; },
            () => { gdata.y -= 1; });

        if (!valid) {
            gdata.score += clearRows();
            $('score').innerText = gdata.score;

            gdata.x = 5;
            gdata.y = 0;

            gdata.dirId = 0;
            gdata.shapeId = parseInt(Math.random()*shapes.length);

            if (!validmove()) {
                return endGame();
            }
        }
    }

    timer = setTimeout(update, 1000/fps); 
}

function setup() {
    document.body.onkeypress = function (evt) {
        switch(evt.key) {
            case 'a':
                gdata.kpress = 1;
                break;
            case 'd':
                gdata.kpress = 2;
                break;
            case 'w':
                gdata.kpress = 3;
                break;
            case 's':
                gdata.kpress = 4;
                break;
        }
    };
}

function endGame() {
    clearTimeout(timer); 
    $('title').innerText = 'game over, refresh for new game';
}
