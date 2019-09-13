const EMPTY = 0;
const WHITE = 0b1;
const BLACK = 0b0;
const WIDTH = 24;

class Game {
    constructor() {
        this.el = document.createElement('DIV');
        this.el.className = "trigammon";
        this.init();
        this.render();
    }
    init() {
        this.board = new Array(WIDTH).fill(EMPTY);
        this.board[0] = (2 << 1) + WHITE;
        this.board[5] = (5 << 1) + BLACK;

        this.board[7] = (3 << 1) + BLACK;
        this.board[11] = (5 << 1) + WHITE;

        this.board[12] = (5 << 1) + BLACK;
        this.board[16] = (3 << 1) + WHITE;

        this.board[18] = (5 << 1) + WHITE;
        this.board[23] = (2 << 1) + BLACK;
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
    hasMinTwo(cell) {
        return (this.board[cell] >> 1) >= 2; 
    }
    hasMinOne(cell) {
        return (this.board[cell] >> 1) >= 1; 
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
        if (this.board[cell] === WHITE)
            this.board[cell] = EMPTY;
    }
    addOne(cell, color) {
        this.board[cell] += 0b10;
        this.setColor(cell, color);
    }
    isAllowed(from, to) {
        if (from < 0 || from > WIDTH || to < 0 || to > WIDTH)
            return false;
        if (to === from)
            return false;
        if (isNaN(from) || isNaN(to))
            return false;
        if (Math.abs(to - from) > 6)
            return false;
        if (!this.hasMinOne(from))
            return false;
        if (this.hasMinTwo(to) && ((this.isWhite(from) && this.isBlack(to)) ||(this.isBlack(from) && this.isWhite(to))))
            return false;
        if (this.isWhite(from) && to < from)
            return false;
        if (this.isBlack(from) && to > from)
            return false;
        return true;
    }
    move(from, to) {
        if (!this.isAllowed(from, to))
            return false;

        let fromColor = this.isWhite(from) ? WHITE : BLACK;
        this.removeOne(from);
        this.addOne(to, fromColor);

        this.render();
    }
    renderHTML() {
        let q = new Array(4).fill('');
        for (let i = WIDTH / 2 - 1; i >= WIDTH / 4; i--) {
            q[0] += `<div data-cell="${i}">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[0] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'}"></span>`;
            q[0] += '</div>';
        }
        for (let i = WIDTH / 4 - 1; i >= 0; i--) {
            q[1] += `<div data-cell="${i}">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[1] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'}"></span>`;
            q[1] += '</div>';
        }
        for (let i = WIDTH / 2; i < WIDTH * 3 / 4; i++) {
            q[2] += `<div data-cell="${i}">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[2] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'}"></span>`;
            q[2] += '</div>';
        }
        for (let i = WIDTH * 3 / 4; i < WIDTH; i++) {
            q[3] += `<div data-cell="${i}">`;
            for (let j = 0; j < this.board[i] >> 1; j++)
                q[3] += `<span class="cell ${this.board[i] % 2 == 0 ? 'cell-black' : 'cell-white'}"></span>`;
            q[3] += '</div>';
        }

        this.el.innerHTML = q.map((w, i) => `<div class="q${i}">${w}</div>`).join('');
    }
    render() {
        return this.renderHTML();

        let q = new Array(4).fill('');
        for (let i = WIDTH / 2 - 1; i >= WIDTH / 4; i--) {
            q[0] += this.board[i] === 0 ? '__' : ((this.board[i] >> 1) + (this.board[i] % 2 == 0 ? 'B' : 'W'));
        }
        for (let i = WIDTH / 4 - 1; i >= 0; i--) {
            q[1] += this.board[i] === 0 ? '__' : ((this.board[i] >> 1) + (this.board[i] % 2 == 0 ? 'B' : 'W'));
        }
        for (let i = WIDTH / 2; i < WIDTH * 3 / 4; i++) {
            q[2] += this.board[i] === 0 ? '__' : ((this.board[i] >> 1) + (this.board[i] % 2 == 0 ? 'B' : 'W'));
        }
        for (let i = WIDTH * 3 / 4; i < WIDTH; i++) {
            q[3] += this.board[i] === 0 ? '__' : ((this.board[i] >> 1) + (this.board[i] % 2 == 0 ? 'B' : 'W'));
        }

        let output = "||" + q[0] + "||" + q[1] + "||" + "\r\n";
        let spaces = new Array(WIDTH / 2).fill(" ").join("");
        for (let i = 0; i < WIDTH / 2; i++) {
            output += "||" + spaces + "||" + spaces + "||" + "\r\n";
        }
        output += "||" + q[2] + "||" + q[3] + "||";

        console.log(output);
    }
}