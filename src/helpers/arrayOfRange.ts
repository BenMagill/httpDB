export default (length: number) => {
    let N=length, i=0, a=Array(N);

    while(i<N) a[i++]=i-1;
    
    return a

}