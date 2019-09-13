const EMPTY = 0;
const BLACK = 0b0;
const WHITE = 0b1;
const WIDTH = 24;
const PENDING_BLACK = WIDTH + BLACK;
const PENDING_WHITE = WIDTH + WHITE;

class Game {
    constructor() {
        this.el = document.createElement('DIV');
        this.el.className = "trigammon";
        this.turn = WHITE;
        this.init();
        this.render();
    }
    init() {
        this.board = new Array(WIDTH + 2).fill(EMPTY);
        this.board[0] = (2 << 1) + WHITE;
        this.board[5] = (5 << 1) + BLACK;

        this.board[7] = (3 << 1) + BLACK;
        this.board[11] = (5 << 1) + WHITE;

        this.board[12] = (5 << 1) + BLACK;
        this.board[16] = (3 << 1) + WHITE;

        this.board[18] = (5 << 1) + WHITE;
        this.board[23] = (2 << 1) + BLACK;

        this.rollDice();
    }
    isWhite(cell) {
        return !this.isEmpty(cell) && this.board[cell] % 2 === WHITE;
    }
    isBlack(cell) {
        return !this.isEmpty(cell) && this.board[cell] % 2 === BLACK;
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
    setWhite(cell) {
        if (this.board[cell] % 2 === BLACK) {
            this.board[cell] += WHITE;
        }
    }
    setBlack(cell) {
        if (this.board[cell] % 2 === WHITE) {
            this.board[cell] -= WHITE;
        }
    }
    setColor(cell, color) {
        if (color === WHITE) {
            this.setWhite(cell);
        } else if (color === BLACK) {
            this.setBlack(cell);
        }
    }
    removeOne(cell) {
        this.board[cell] -= 0b10;
        if (this.getCount(cell) === 0)
            this.board[cell] = EMPTY;
    }
    addOne(cell, color) {
        this.board[cell] += 0b10;
        this.setColor(cell, color);
    }
    capture(cell) {
        if (this.getColor(cell) === WHITE) {
            this.addOne(PENDING_WHITE, WHITE);
        } else {
            this.addOne(PENDING_BLACK, BLACK);
        }
        this.removeOne(cell);
    }
    isAllowed(from, to) {
        if (from < 0 || from > WIDTH + 2 || to < 0 || to > WIDTH + 2) {
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
        if (this.isWhite(from) && from !== PENDING_WHITE && to < from) {
            console.log("error: " + 8);
            return false;
        }
        if (this.isBlack(from) && to > from) {
            console.log("error: " + 9);
            return false;
        }
        if (from === PENDING_BLACK && (to > WIDTH || to < WIDTH * 3 / 4)) {
            console.log("error: " + 10);
            return false;
        }
        if (from === PENDING_WHITE && (to >= WIDTH / 4)) {
            console.log("error: " + 11);
            return false;
        }
        if (this.turn === WHITE && this.hasMinOne(PENDING_WHITE) && from !== PENDING_WHITE) {
            console.log("error: " + 12);
            return false;
        }
        if (this.turn === BLACK && this.hasMinOne(PENDING_BLACK) && from !== PENDING_BLACK) {
            console.log("error: " + 13);
            return false;
        }
        // TO DO
        // Check condition
        if (from < WIDTH && this.dice.filter(dice => !dice.used).map(dice => dice.value).indexOf(Math.abs(to - from)) === -1) {
            console.log("error: " + 14);
            return false;
        }
        return true;
    }
    move(from, to) {
        if (!this.isAllowed(from, to))
            return false;

        let fromColor = this.isWhite(from) ? WHITE : BLACK;
        let toColor = this.isWhite(to) ? WHITE : BLACK;
        this.removeOne(from);
        if (fromColor !== toColor && this.hasOne(to))
            this.capture(to);
        this.addOne(to, fromColor);

        // TO DO 
        // CASE WHEN piece is OUT
        let dice = this.dice.find(d => d.value === Math.abs(to - from) && d.used === false);
        if (dice) dice.used = true;

        this.render();
    }
    endTurn() {
        if (this.areMovesAvailable()) return this.render();
        this.turn = this.turn === BLACK ? WHITE : BLACK;
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
        this.areMovesAvailable();
        this.render();
    }
    renderBoard() {
        let q = new Array(6).fill('');
        for (let i = WIDTH / 2 - 1; i >= WIDTH / 4; i--) {
            q[0] += `<div data-cell="${i}"><div class="flex-c">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[0] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}"></span>`;
            q[0] += '</div></div>';
        }
        for (let i = WIDTH / 4 - 1; i >= 0; i--) {
            q[1] += `<div data-cell="${i}"><div class="flex-c">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[1] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}"></span>`;
            q[1] += '</div></div>';
        }
        for (let i = WIDTH / 2; i < WIDTH * 3 / 4; i++) {
            q[2] += `<div data-cell="${i}"><div class="flex-ci">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[2] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}"></span>`;
            q[2] += '</div></div>';
        }
        for (let i = WIDTH * 3 / 4; i < WIDTH; i++) {
            q[3] += `<div data-cell="${i}"><div class="flex-ci">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[3] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === i ? 'dragged' : ''}"></span>`;
            q[3] += '</div></div>';
        }

        q[4] += `<div data-cell="${PENDING_BLACK}" class="pending-black"><div class="flex-c">`;
        for (let j = 0; j < this.board[PENDING_BLACK] >> 1; j++)
            q[4] += `<span class="cell ${this.board[PENDING_BLACK] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === PENDING_BLACK ? 'dragged' : ''}"></span>`;
        q[4] += '</div></div>';

        q[5] += `<div data-cell="${PENDING_WHITE}" class="pending-white"><div class="flex-c">`;
        for (let j = 0; j < this.board[PENDING_WHITE] >> 1; j++)
            q[5] += `<span class="cell ${this.board[PENDING_WHITE] % 2 == 0 ? 'cell-black' : 'cell-white'} ${this.toDrag === PENDING_WHITE ? 'dragged' : ''}"></span>`;
        q[5] += '</div></div>';

        return '<div class="trigammon-table">' + q.map((w, i) => `<div class="q${i}">${w}</div>`).join('') + '</div>';
    }
    initDragEvents() {
        let FROM = -1;
        let pieces = [].slice.apply(this.el.querySelectorAll(`.cell.cell-${this.turn === WHITE ? 'white' : 'black'}`));
        pieces.forEach(piece => {
            piece.draggable = true;
            piece.addEventListener('dragstart', (event) => {
                FROM = +event.target.closest('[data-cell]').dataset.cell;
                event.dataTransfer.setData("text/plain", FROM);
                // event.target.classList.add('dragged');
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
                this.move(from, to);
                this.areMovesAvailable();
                this.render();
                FROM = -1;
            });
        });
    }
    isDiceAvailable(dice) {
        if (this.turn === WHITE && this.hasMinOne(PENDING_WHITE))
            return this.getCount(dice - 1) < 2 || this.getColor(dice - 1) === WHITE;
        if (this.turn === BLACK && this.hasMinOne(PENDING_BLACK))
            return this.getCount(WIDTH - dice) < 2 || this.getColor(WIDTH - dice) === BLACK;
        for (let i = 0; i < WIDTH; i++) {
            if (this.hasMinOne(i) && WHITE === this.turn && this.isAllowed(i, i + dice)) {
                return true;
            }
            if (this.hasMinOne(i) && BLACK === this.turn && this.isAllowed(i, i - dice)) {
                return true;
            }
        }
        return false;
    }
    areMovesAvailable() {
        for (let i = 0; i < this.dice.length; i++) {
            this.dice[i].allowed = this.isDiceAvailable(this.dice[i].value);
        }
        return this.dice.filter(dice => dice.allowed && !dice.used).length > 0;
    }
    initEvents() {
        this.initDragEvents();
        let endTurnBtn = this.el.querySelector('.trigammon-end-turn');
        endTurnBtn.addEventListener('click', this.endTurn.bind(this));
    }
    renderButtons() {
        return '<div class="trigammon-buttons">' +
            '<p class="trigammon-turn">' + (this.turn === WHITE ? 'WHITE' : 'BLACK') + '</p>' +
            '<button class="trigammon-end-turn">END TURN</button>' +
            '<div class="trigammon-dices">' + 
                this.dice.map(dice => `<div class="trigammon-dice trigammon-dice-${dice.used ? 'used' : 'unused'} trigammon-dice-${dice.allowed ? 'allowed' : 'notallowed'}">${dice.value}</div>`).join('') +
            '</div>' +
        '</div>';
    }
    render() {
        this.el.innerHTML = this.renderBoard() + this.renderButtons();
        this.initEvents();
    }
}