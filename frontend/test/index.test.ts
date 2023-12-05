import { sum } from "../src";

test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
});

test('adds 0 + 1 to equal 1', () => {
    expect(sum(0, 1)).toBe(1);
});

test('adds -1 + 1 to equal 0', () => {
    expect(sum(-1, 1)).toBe(0);
});
