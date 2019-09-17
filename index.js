const NAME = 'bgm';
const EMPTY = 0;
const BLACK = 0b0;
const WHITE = 0b1;
const WIDTH = 24;
const REMOVED = {
    [BLACK]: 24,
    [WHITE]: 25
}
const PENDING = {
    [BLACK]: 26,
    [WHITE]: 27
};

class Game {
    constructor() {
        this.el = document.createElement('DIV');
        this.el.className = NAME;
        this.turn = BLACK;
        this.canRemove = {
            [BLACK]: false,
            [WHITE]: false
        };
        this.init();
        this.render();
    }
    init() {
        this.turn = this.turn === WHITE ? BLACK : WHITE;
        this.board = new Array(28).fill(EMPTY);
        this.board[0] = (2 << 1) + WHITE;
        this.board[5] = (5 << 1) + BLACK;

        this.board[7] = (3 << 1) + BLACK;
        this.board[11] = (5 << 1) + WHITE;

        this.board[12] = (5 << 1) + BLACK;
        this.board[16] = (3 << 1) + WHITE;

        this.board[18] = (5 << 1) + WHITE;
        this.board[23] = (2 << 1) + BLACK;

        this.state = [];

        [WHITE, BLACK].forEach(this.checkIfCanRemove.bind(this));

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
        const A_PENDING = [PENDING[WHITE], PENDING[BLACK]];
        const A_REMOVED = [REMOVED[WHITE], REMOVED[BLACK]];
        const A_PENDING_REMOVED = A_PENDING.concat(A_REMOVED);
        if (from < 0 || (from >= WIDTH && A_PENDING.indexOf(from) === -1) ||
            to < 0 || (to >= WIDTH && A_PENDING_REMOVED.indexOf(to) === -1)) {
            console.log("not allowed");
            return false;
        }
        if (to === REMOVED[this.turn] && !this.canRemove[this.turn]) {
            console.log("not allowed");
            return false;
        }
        if (to === from) {
            console.log("not allowed");
            return false;
        }
        if (isNaN(from) || isNaN(to)) {
            console.log("not allowed");
            return false;
        }
        if (Math.abs(to - from) > 6 && from < WIDTH && A_REMOVED.indexOf(to) === -1) {
            console.log("not allowed");
            return false;
        }
        if (!this.hasMinOne(from)) {
            console.log("not allowed");
            return false;
        }
        if (this.turn !== this.getColor(from)) {
            console.log("not allowed");
            return false;
        }
        if (this.hasMinTwo(to) && this.getColor(from) !== this.getColor(to) && A_REMOVED.indexOf(to) === -1) {
            console.log("not allowed");
            return false;
        }
        if (this.isWhite(from) && from !== PENDING[WHITE] && to < from) {
            console.log("not allowed");
            return false;
        }
        if (this.isBlack(from) && to > from && to !== REMOVED[BLACK]) {
            console.log("not allowed");
            return false;
        }
        if (from === PENDING[BLACK] && (to > WIDTH || to < WIDTH * 3 / 4)) {
            console.log("not allowed");
            return false;
        }
        if (from === PENDING[WHITE] && (to >= WIDTH / 4)) {
            console.log("not allowed");
            return false;
        }
        if (this.hasMinOne(PENDING[this.turn]) && from !== PENDING[this.turn]) {
            console.log("not allowed");
            return false;
        }
        if (this.getJustUsedDice(from, to) == null) {
            console.log("not allowed");
            return false;
        }
        return true;
    }
    undo() {
        if (this.state.length === 0) return;
        let obj = this.state.pop();
        this.board = obj.board;
        this.dice = obj.dice;
        this.canRemove = obj.canRemove;

        this.render();
    }
    checkIfCanRemove(color) {
        if (this.getCapturedCount(color) > 0) {
            this.canRemove[color] = false;
            return false;
        }
        for (let i = 0; i < WIDTH; i++) {
            if (this.isBlack(i) && i <= 5) continue;
            if (this.isWhite(i) && i >= WIDTH - 6) continue;
            if (this.isColor(i, color)) {
                this.canRemove[color] = false;
                return false;
            }
        }
        this.canRemove[color] = true;
        return true;
    }
    isGameOver() {
        return this.getCount(REMOVED[WHITE]) === 15 || this.getCount(REMOVED[BLACK]) === 15;
    }
    move(from, to) {
        if (!this.isAllowed(from, to))
            return false;

        this.state.push({
            dice: JSON.parse(JSON.stringify(this.dice)),
            board: JSON.parse(JSON.stringify(this.board)),
            canRemove: JSON.parse(JSON.stringify(this.canRemove)),
        });

        let fromColor = this.getColor(from);
        let toColor = this.getColor(to);
        this.removeOne(from);
        if (to < WIDTH && fromColor !== toColor && this.hasOne(to))
            this.capture(to);
        this.addOne(to, fromColor);

        this.checkIfCanRemove(fromColor);
        this.checkIfCanRemove(toColor);

        let dice = this.getJustUsedDice(from, to);
        if (dice) dice.used = true;
        this.render();
        
        if (this.isGameOver()) {
            alert('GAME OVER');
            this.init();
        }

        return true;
    }
    isFreeBetween(from, to, color) {
        if (from > to) {
            let temp = from;
            from = to;
            to = temp;
        }
        for (let i = from; i <= to; i++) {
            if (this.getColor(i) === color) {
                return false;
            }
        }
        return true;
    }
    getJustUsedDice(from, to) {
        return this.dice.find(dice => (
            !dice.used && (
                (from !== PENDING[this.turn] && to !== REMOVED[this.turn] && dice.value === Math.abs(to - from))
                || (from === PENDING[this.turn] && dice.value === (this.turn === WHITE ? to + 1 : WIDTH - to))
                || (to === REMOVED[this.turn] && 
                    (
                        dice.value === (this.turn === BLACK ? from + 1 : WIDTH - from)
                        || (this.isFreeBetween(this.turn === BLACK ? from + 1 : from - 1, this.turn === BLACK ? 5 : WIDTH - 6, this.turn)
                                && dice.value > (this.turn === BLACK ? from + 1 : WIDTH - from))
                    )
                )
            )
        ));
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

        if (this.turn === BLACK) {
            this.computerPlay();
        }
    }
    computerPlay() {
        const TIMEOUT = 500;
        let allowed = this.getAllowedDice();
        if (allowed.length === 0) {
            setTimeout(() => {
                this.endTurn();
            }, TIMEOUT);
        } else {
            setTimeout(() => {
                for (let i = PENDING[BLACK]; i <= PENDING[WHITE]; i++) {
                    if (this.isBlack(i)) {
                        if (this.moveCellBy(i, allowed[0])) {
                            this.computerPlay();
                            return;
                        }
                    }
                }
                for (let i = WIDTH - 1; i >= 0; i--) {
                    if (this.isBlack(i)) {
                        if (this.moveCellBy(i, allowed[0])) {
                            this.computerPlay();
                            return;
                        }
                    }
                }
            }, TIMEOUT);
        }
    }
    getAllowedDice() {
        return this.dice.filter(dice => dice.allowed && !dice.used).map(dice => dice.value);
    }
    moveCellBy(cell, dice) {
        if (this.isWhite(cell)) 
            if (cell === PENDING[WHITE])
                return this.move(cell, dice - 1);
            else if (cell + dice >= WIDTH)
                return this.move(cell, REMOVED[WHITE]);
            else
                return this.move(cell, cell + dice);
        else if (this.isBlack(cell)) 
            if (cell === PENDING[BLACK])
                return this.move(cell, WIDTH - dice);
            else if (cell - dice < 0)
                return this.move(cell, REMOVED[BLACK]);
            else
                return this.move(cell, cell - dice);
        return false;
    }
    getCellByIfAvailable(cell, dice) {
        if (this.isWhite(cell)) 
            if (cell === PENDING[WHITE])
                return this.isAllowed(cell, dice - 1) && dice - 1;
            else if (cell + dice >= WIDTH)
                return this.isAllowed(cell, REMOVED[WHITE]);
            else
                return this.isAllowed(cell, cell + dice) && cell + dice;
        else if (this.isBlack(cell)) 
            if (cell === PENDING[BLACK])
                return this.isAllowed(cell, WIDTH - dice) && WIDTH - dice;
            else if (cell - dice < 0)
                return this.isAllowed(cell, REMOVED[BLACK]);
            else
                return this.isAllowed(cell, cell - dice) && cell - dice;
        return false;
    }
    isDiceAvailable(dice) {
        if (this.turn === WHITE && this.hasMinOne(PENDING[this.turn]))
            return this.getCount(dice - 1) < 2 || this.getColor(dice - 1) === this.turn;
        if (this.turn === BLACK && this.hasMinOne(PENDING[this.turn]))
            return this.getCount(WIDTH - dice) < 2 || this.getColor(WIDTH - dice) === this.turn;
        for (let i = 0; i < WIDTH; i++) {
            if (this.hasMinOne(i) && WHITE === this.turn && this.isAllowed(i, i + dice >= WIDTH ? REMOVED[WHITE] : i + dice))
                return true;
            if (this.hasMinOne(i) && BLACK === this.turn && this.isAllowed(i, i - dice < 0 ? REMOVED[BLACK] : i - dice))
                return true;
        }
        return false;
    }
    checkMovesAvailable() {
        for (let i = 0; i < this.dice.length; i++) {
            this.dice[i].allowed = this.isDiceAvailable(this.dice[i].value);
        }
        return this.getAllowedDice().length > 0;
    }


    renderBoard() {
        const MAX = 5;
        let q = new Array(8).fill('');
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

        let totalRW = this.board[REMOVED[WHITE]] >> 1;
        let showRW = totalRW >= 1;
        q[6] += `<div data-cell="${REMOVED[WHITE]}" class="removed-white"><div class="flex-c">`;
        for (let j = 0; j < (showRW ? 1 : 0); j++)
            q[6] += `<span class="cell cell-removed ${this.board[REMOVED[WHITE]] % 2 == 0 ? 'cell-black' : 'cell-white'}">${showRW ? totalRW : ''}</span>`;
        q[6] += '</div></div>';

        let totalRB = this.board[REMOVED[BLACK]] >> 1;
        let showRB = totalRB >= 1;
        q[7] += `<div data-cell="${REMOVED[BLACK]}" class="removed-black"><div class="flex-c">`;
        for (let j = 0; j < (showRB ? 1 : 0); j++)
            q[7] += `<span class="cell cell-removed ${this.board[REMOVED[BLACK]] % 2 == 0 ? 'cell-black' : 'cell-white'}">${showRB ? totalRB : ''}</span>`;
        q[7] += '</div></div>';

        return `${q.map((w, i) => `<div class="q${i}">${w}</div>`).join('')}
            <div class="${NAME}-dices ${NAME}-dices-${this.turn === WHITE ? 'white' : 'black'} ${this.dice.length === 4 ? `${NAME}-dices-double` : ''}">
                ${this.dice.filter(d => !d.used && d.allowed).length === 0 ? `<button class="${NAME}-end-turn">END TURN</button>` : ''}
                ${this.dice.map(dice => `<div class="${NAME}-dice ${NAME}-dice-${dice.used ? 'used' : 'unused'} ${NAME}-dice-${dice.allowed ? 'allowed' : 'notallowed'}">${dice.value}</div>`).join('')}
                ${this.state.length > 0 ? `<button class="${NAME}-undo">UNDO</button>` : ''}
            </div>`;
    }
    initEvents() {
        let FROM = -1;
        let cells = [].slice.apply(this.el.querySelectorAll('[data-cell]'));
        let pieces = [].slice.apply(this.el.querySelectorAll(`.cell.cell-${this.turn === WHITE ? 'white' : 'black'}`));
        pieces.forEach(piece => {
            piece.draggable = true;
            piece.addEventListener('dragstart', (event) => {
                FROM = +event.target.closest('[data-cell]').dataset.cell;
                event.dataTransfer.setData("text/plain", FROM);
                cells.forEach(cell => cell.classList.remove('allowed'));
                let available = this.getAllowedDice();
                const checkAvailable = (dice) => {
                    let nextPos = this.getCellByIfAvailable(FROM, dice);
                    if (nextPos !== false) {
                        let cell = cells.filter(cell => cell.dataset.cell == nextPos);
                        if (cell.length) cell[0].classList.add('allowed');
                    }
                };
                available.forEach(checkAvailable);
            });
            piece.addEventListener('click', (event) => {
                event.preventDefault();
                let dice = this.getAllowedDice();
                if (dice.length === 0) return false;
                FROM = +event.target.closest('[data-cell]').dataset.cell;
                let moveStatus = this.moveCellBy(FROM, dice[0]);
                if (moveStatus === false && dice[1]) {
                    moveStatus = this.moveCellBy(FROM, dice[1]);
                }
                if (moveStatus !== false) {
                    this.checkMovesAvailable();
                    this.render();
                }
            });
        });

        cells.forEach(cell => {
            cell.addEventListener('dragover', (event) => {
                let cell = event.target.closest('[data-cell]');
                let to = +cell.dataset.cell;
                if (this.isAllowed(FROM, to)) {
                    event.preventDefault();
                    cells.forEach(cell => cell.classList.remove('dragover'));
                    cell.classList.add('dragover');
                }
            });
            cell.addEventListener('dragend', (event) => {
                cells.forEach(cell => {
                    cell.classList.remove('allowed');
                    cell.classList.remove('dragover');
                });
            });
            cell.addEventListener('drop', (event) => {
                event.preventDefault();
                let cell = event.target.closest('[data-cell]');
                cells.forEach(cell => cell.classList.remove('dragover'));
                let from = +event.dataTransfer.getData("text/plain");
                let to = +cell.dataset.cell;
                if (this.move(from, to)) {
                    this.checkMovesAvailable();
                    this.render();
                }
                FROM = -1;
            });
        });

        let endTurnBtn = this.el.querySelector(`.${NAME}-end-turn`);
        if (endTurnBtn) endTurnBtn.addEventListener('click', this.endTurn.bind(this));

        let dices = [].slice.call(this.el.querySelectorAll(`.${NAME}-dice`));
        const onDiceClick = (event) => {
            this.dice = this.dice.reverse();
            this.render();
        };
        dices.forEach(dice => dice.addEventListener('click', onDiceClick));

        let undoBtn = this.el.querySelector(`.${NAME}-undo`);
        if (undoBtn) undoBtn.addEventListener('click', this.undo.bind(this));        
    }
    render() {
        this.el.innerHTML = this.renderBoard();
        this.initEvents();
    }
}