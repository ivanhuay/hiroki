class Test{
  set a (val){
    this.a = val;
  }
  get a() {
    return this.a(arguments)
  }
}


example = new Test();

example.a = (num) => {
  console.log('execution: ', num + 1);
  return num + 1;
}

example.a(123)
