const EMPTY = 0;
const BLACK = 0b0;
const WHITE = 0b1;
const WIDTH = 24;
const PENDING = {
    [BLACK]: 100,
    [WHITE]: 101
};

class Game {
    constructor() {
        this.el = document.createElement('DIV');
        this.el.className = "trigammon";
        this.turn = WHITE;
        this.init();
        this.render();
    }
    init() {
        this.board = new Array(102).fill(EMPTY);
        this.board[0] = (2 << 1) + WHITE;
        this.board[5] = (5 << 1) + BLACK;

        this.board[7] = (3 << 1) + BLACK;
        this.board[11] = (5 << 1) + WHITE;

        this.board[12] = (5 << 1) + BLACK;
        this.board[16] = (3 << 1) + WHITE;

        this.board[18] = (5 << 1) + WHITE;
        this.board[23] = (2 << 1) + BLACK;

        this.state = [];

        // this.board = [4, 0, 4, 2, 4, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 15, 5, 5, 0, 0, 9, 0, 0]

        this.rollDice();
    }
    isColor(cell, color) {
        return !this.isEmpty(cell) && this.board[cell] % 2 === color;
    }
    isWhite(cell) {
        return this.isColor(cell, WHITE);
    }
    isBlack(cell) {
        return this.isColor(cell, BLACK);
    }
    isEmpty(cell) {
        return this.board[cell] === EMPTY;
    }
    getColor(cell) {
        if (this.isWhite(cell)) return WHITE;
        if (this.isBlack(cell)) return BLACK;
        return null;
    }
    getCount(cell) {
        return this.board[cell] >> 1;
    }
    hasMinTwo(cell) {
        return this.getCount(cell) >= 2; 
    }
    hasMinOne(cell) {
        return this.getCount(cell) >= 1; 
    }
    hasOne(cell) {
        return this.getCount(cell) === 1;
    }
    markAsWhite(cell) {
        if (this.board[cell] % 2 === BLACK) {
            this.board[cell] += WHITE;
        }
    }
    markAsBlack(cell) {
        if (this.board[cell] % 2 === WHITE) {
            this.board[cell] -= WHITE;
        }
    }
    markAsColor(cell, color) {
        if (color === WHITE) {
            this.markAsWhite(cell);
        } else if (color === BLACK) {
            this.markAsBlack(cell);
        }
    }
    removeOne(cell) {
        this.board[cell] -= 0b10;
        if (this.getCount(cell) === 0)
            this.board[cell] = EMPTY;
    }
    addOne(cell, color) {
        this.board[cell] += 0b10;
        this.markAsColor(cell, color);
    }
    capture(cell) {
        let color = this.getColor(cell);
        this.addOne(PENDING[color], color);
        this.removeOne(cell);
    }
    getCapturedCount(color) {
        return this.getCount(PENDING[color]);
    }
    isAllowed(from, to) {
        if (from < 0 || (from > WIDTH && from !== PENDING[WHITE] && from !== PENDING[BLACK]) ||
            to < 0 || (to > WIDTH && to !== PENDING[WHITE] && to !== PENDING[BLACK])) {
            console.log("error: " + 1);
            return false;
        }
        if (to === from) {
            console.log("error: " + 2);
            return false;
        }
        if (isNaN(from) || isNaN(to)) {
            console.log("error: " + 3);
            return false;
        }
        if (Math.abs(to - from) > 6 && from < WIDTH) {
            console.log("error: " + 4);
            return false;
        }
        if (!this.hasMinOne(from)) {
            console.log("error: " + 5);
            return false;
        }
        if (this.turn !== this.getColor(from)) {
            console.log("error: " + 6);
            return false;
        }
        if (this.hasMinTwo(to) && this.getColor(from) !== this.getColor(to)) {
            console.log("error: " + 7);
            return false;
        }
        if (this.isWhite(from) && from !== PENDING[WHITE] && to < from) {
            console.log("error: " + 8);
            return false;
        }
        if (this.isBlack(from) && to > from) {
            console.log("error: " + 9);
            return false;
        }
        if (from === PENDING[BLACK] && (to > WIDTH || to < WIDTH * 3 / 4)) {
            console.log("error: " + 10);
            return false;
        }
        if (from === PENDING[WHITE] && (to >= WIDTH / 4)) {
            console.log("error: " + 11);
            return false;
        }
        if (this.hasMinOne(PENDING[this.turn]) && from !== PENDING[this.turn]) {
            console.log("error: " + 12);
            return false;
        }
        if (this.dice.filter(dice => 
            !dice.used && (
                dice.value === Math.abs(to - from)
                || (
                    from === PENDING[this.turn]
                    && dice.value === (this.turn === WHITE ? to + 1 : WIDTH - to)
                )
            )
        ).length === 0) {
            console.log("error: " + 13);
            return false;
        }
        return true;
    }
    undo() {
        if (this.state.length === 0) return;
        let obj = this.state.pop();
        this.board = obj.board;
        this.dice = obj.dice;

        this.render();
    }
    move(from, to) {
        if (!this.isAllowed(from, to))
            return false;

        this.state.push({
            dice: JSON.parse(JSON.stringify(this.dice)),
            board: JSON.parse(JSON.stringify(this.board)),
            turn: this.turn
        });

        let fromColor = this.getColor(from);
        let toColor = this.getColor(to);
        this.removeOne(from);
        if (fromColor !== toColor && this.hasOne(to))
            this.capture(to);
        this.addOne(to, fromColor);

        let dice = this.dice.find(d => (
            (d.value === Math.abs(to - from) || (from === PENDING[this.turn] && d.value === (this.turn === WHITE ? to + 1 : WIDTH - to)))
            && d.used === false
        ));
        if (dice) dice.used = true;
        this.render();

        return true;
    }
    endTurn() {
        if (this.checkMovesAvailable()) return this.render();
        this.turn = this.turn === BLACK ? WHITE : BLACK;
        this.state = [];
        this.rollDice();
    }
    rollDice() {
        this.dice = [{
            value: Math.floor(Math.random() * 6) + 1,
            used: false,
            allowed: true
        }, {
            value: Math.floor(Math.random() * 6) + 1,
            used: false,
            allowed: true
        }];
        if (this.dice[1].value > this.dice[0].value) {
            this.dice = this.dice.reverse();
        }
        if (this.dice[0].value === this.dice[1].value) {
            this.dice = this.dice.concat([{
                value: this.dice[0].value,
                used: false,
                allowed: true
            }, {
                value: this.dice[0].value,
                used: false,
                allowed: true
            }]);
        }
        this.checkMovesAvailable();
        this.render();
    }
    moveCellBy(cell, dice) {
        if (this.isWhite(cell)) 
            if (cell === PENDING[WHITE])
                return this.move(cell, dice - 1);
            else
                return this.move(cell, cell + dice);
        else if (this.isBlack(cell)) 
            if (cell === PENDING[BLACK])
                return this.move(cell, WIDTH - dice);
            else
                return this.move(cell, cell - dice);
        return false;
    }
    isDiceAvailable(dice) {
        if (this.turn === WHITE && this.hasMinOne(PENDING[this.turn]))
            return this.getCount(dice - 1) < 2 || this.getColor(dice - 1) === this.turn;
        if (this.turn === BLACK && this.hasMinOne(PENDING[this.turn]))
            return this.getCount(WIDTH - dice) < 2 || this.getColor(WIDTH - dice) === this.turn;
        for (let i = 0; i < WIDTH; i++) {
            if (this.hasMinOne(i) && WHITE === this.turn && this.isAllowed(i, i + dice))
                return true;
            if (this.hasMinOne(i) && BLACK === this.turn && this.isAllowed(i, i - dice))
                return true;
        }
        return false;
    }
    checkMovesAvailable() {
        for (let i = 0; i < this.dice.length; i++) {
            this.dice[i].allowed = this.isDiceAvailable(this.dice[i].value);
        }
        return this.dice.filter(dice => dice.allowed && !dice.used).length > 0;
    }


    renderBoard() {
        const MAX = 5;
        let q = new Array(6).fill('');
        for (let i = WIDTH / 2 - 1; i >= WIDTH / 4; i--) {
            q[0] += `<div data-cell="${i}"><div class="flex-c">`;
            let count = this.board[i] >> 1;
            let forloops = count > MAX ? MAX : count;
            for (let j = 0; j < forloops; j++)
                q[0] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}">${count > MAX && j === MAX - 1 ? count : ''}</span>`;
            q[0] += '</div></div>';
        }
        for (let i = WIDTH / 4 - 1; i >= 0; i--) {
            q[1] += `<div data-cell="${i}"><div class="flex-c">`;
            let count = this.board[i] >> 1;
            let forloops = count > MAX ? MAX : count;
            for (let j = 0; j < forloops; j++)
                q[1] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}">${count > MAX && j === MAX - 1 ? count : ''}</span>`;
            q[1] += '</div></div>';
        }
        for (let i = WIDTH / 2; i < WIDTH * 3 / 4; i++) {
            q[2] += `<div data-cell="${i}"><div class="flex-ci">`;
            let count = this.board[i] >> 1;
            let forloops = count > MAX ? MAX : count;
            for (let j = 0; j < forloops; j++)
                q[2] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}">${count > MAX && j === 0 ? count : ''}</span>`;
            q[2] += '</div></div>';
        }
        for (let i = WIDTH * 3 / 4; i < WIDTH; i++) {
            q[3] += `<div data-cell="${i}"><div class="flex-ci">`;
            let count = this.board[i] >> 1;
            let forloops = count > MAX ? MAX : count;
            for (let j = 0; j < forloops; j++)
                q[3] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}">${count > MAX && j === 0 ? count : ''}</span>`;
            q[3] += '</div></div>';
        }

        let totalB = this.board[PENDING[BLACK]] >> 1;
        let showB = totalB >= 3;
        q[4] += `<div data-cell="${PENDING[BLACK]}" class="pending-black"><div class="flex-c">`;
        for (let j = 0; j < (totalB < 3 ? totalB : 1); j++)
            q[4] += `<span class="cell ${this.board[PENDING[BLACK]] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === PENDING[BLACK] ? 'dragged' : ''}">${showB ? totalB : ''}</span>`;
        q[4] += '</div></div>';

        let totalW = this.board[PENDING[WHITE]] >> 1;
        let showW = totalW >= 3;
        q[5] += `<div data-cell="${PENDING[WHITE]}" class="pending-white"><div class="flex-c">`;
        for (let j = 0; j < (totalW < 3 ? totalW : 1); j++)
            q[5] += `<span class="cell ${this.board[PENDING[WHITE]] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === PENDING[WHITE] ? 'dragged' : ''}">${showW ? totalW : ''}</span>`;
        q[5] += '</div></div>';

        return `${q.map((w, i) => `<div class="q${i}">${w}</div>`).join('')}
            <div class="trigammon-dices trigammon-dices-${this.turn === WHITE ? 'white' : 'black'} ${this.dice.length === 4 ? 'trigammon-dices-double' : ''}">
                ${this.dice.filter(d => !d.used && d.allowed).length === 0 ? '<button class="trigammon-end-turn">END TURN</button>' : ''}
                ${this.dice.map(dice => `<div class="dice dice-${dice.value} trigammon-dice trigammon-dice-${dice.used ? 'used' : 'unused'} trigammon-dice-${dice.allowed ? 'allowed' : 'notallowed'}">${dice.value}</div>`).join('')}
                ${this.state.length > 0 ? '<button class="trigammon-undo">UNDO</button>' : ''}
            </div>`;
    }
    initEvents() {
        let FROM = -1;
        let pieces = [].slice.apply(this.el.querySelectorAll(`.cell.cell-${this.turn === WHITE ? 'white' : 'black'}`));
        pieces.forEach(piece => {
            piece.draggable = true;
            piece.addEventListener('dragstart', (event) => {
                FROM = +event.target.closest('[data-cell]').dataset.cell;
                event.dataTransfer.setData("text/plain", FROM);
                // event.target.classList.add('dragged');
            });
            piece.addEventListener('click', (event) => {
                event.preventDefault();
                let dice = this.dice.filter(d => !d.used && d.allowed);
                if (dice.length === 0) return false;
                FROM = +event.target.closest('[data-cell]').dataset.cell;
                let moveStatus = this.moveCellBy(FROM, dice[0].value);
                if (moveStatus === false && dice[1]) {
                    moveStatus = this.moveCellBy(FROM, dice[1].value);
                }
                if (moveStatus !== false) {
                    this.checkMovesAvailable();
                    this.render();
                }
            });
        });

        let cells = [].slice.apply(this.el.querySelectorAll('[data-cell]'));
        cells.forEach(cell => {
            cell.addEventListener('dragover', (event) => {
                let cell = event.target.closest('[data-cell]');
                let to = +cell.dataset.cell;
                if (this.isAllowed(FROM, to)) {
                    console.log(FROM, to, 'allowed');
                    event.preventDefault();
                    cells.forEach(cell => cell.classList.remove('dragover'));
                    cell.classList.add('dragover');
                }
            });
            cell.addEventListener('drop', (event) => {
                event.preventDefault();
                let cell = event.target.closest('[data-cell]');
                cells.forEach(cell => cell.classList.remove('dragover'));
                console.log('drop');
                let from = +event.dataTransfer.getData("text/plain");
                let to = +cell.dataset.cell;
                if (this.move(from, to)) {
                    this.checkMovesAvailable();
                    this.render();
                }
                FROM = -1;
            });
        });

        let endTurnBtn = this.el.querySelector('.trigammon-end-turn');
        if (endTurnBtn) endTurnBtn.addEventListener('click', this.endTurn.bind(this));

        let dices = this.el.querySelector('.trigammon-dices');
        if (dices) dices.addEventListener('click', (event) => {
            this.dice = this.dice.reverse();
            this.render();
        });

        let undoBtn = this.el.querySelector('.trigammon-undo');
        if (undoBtn) undoBtn.addEventListener('click', this.undo.bind(this));        
    }
    render() {
        this.el.innerHTML = this.renderBoard();
        this.initEvents();
    }
}