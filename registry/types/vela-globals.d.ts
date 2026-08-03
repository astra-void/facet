/// <reference types="vela-rbxts" />

// `vela-rbxts` augments `React.Attributes` with `className`. That augmentation
// is global, but only once the module is part of the program — and no registry
// source imports it, because in a consumer's project Vela is already set up.
// This file pulls it in for our own typechecking, and is never copied.
