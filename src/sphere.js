class Octahedron {
  /*
   *   0   0   0   0
   *  /1\ /2\ /3\ /4\
   * 1---2---3---4---1
   *  \5/ \6/ \7/ \8/
   *   5   5   5   5
   */
  constructor() {
    this.vertices = [
      // position     // texture
      0.0, 0.0, 1.0, 0.5, 0.5,    // 0 top
      1.0, 0.0, 0.0, 1.0, 0.5,    // 1 
      0.0, 1.0, 0.0, 0.5, 1.0,    // 2
      -1.0, 0.0, 0.0, 0.0, 0.5,   // 3
      0.0, -1.0, 0.0, 0.5, 0.0,   // 4
      0.0, 0.0, -1.0, 1.0, 1.0,   // 5 bottom
    ];
    this.indices = [
      0, 1, 2,    // 1
      0, 2, 3,    // 2
      0, 3, 4,    // 3
      0, 4, 1,    // 4
      5, 2, 1,    // 5
      5, 3, 2,    // 6
      5, 4, 3,    // 7
      5, 1, 4,    // 8
    ];
    this.stride = 5;
  }
}

export class Sphere extends Octahedron {
  constructor(radius = 1.0) {
    super();
    this.radius = radius;
  }
  subdivide(n) {
    // for each face
    let indices = this.indices;
    let newIndices = [];
    for (let i = 0; i < indices.length; i += 3) {
      this.#subdivide(n,
        indices[i],
        indices[i + 1],
        indices[i + 2],
        newIndices);
    }
    this.indices = newIndices;
  }
  /* This has a big big problem of doubling vertices!!! */
  /* Make this better later I just want something working rn */
  #subdivide(n, i1, i2, i3, newIndices) {
    if (n <= 0) {
      newIndices.push(i1);
      newIndices.push(i2);
      newIndices.push(i3);
      return;
    }

    let stride = this.stride;
    let vertices = this.vertices;

    const v1 = vertices.slice(i1 * stride, (i1 + 1) * stride);
    const v2 = vertices.slice(i2 * stride, (i2 + 1) * stride);
    const v3 = vertices.slice(i3 * stride, (i3 + 1) * stride);

    // position 
    const v12 = this.#normalize(this.#midpoint(v1.slice(0, 3), v2.slice(0, 3)));
    const v23 = this.#normalize(this.#midpoint(v2.slice(0, 3), v3.slice(0, 3)));
    const v31 = this.#normalize(this.#midpoint(v3.slice(0, 3), v1.slice(0, 3)));

    // texture
    v12.push(...this.#midpoint(v1.slice(3, 5), v2.slice(3, 5)));
    v23.push(...this.#midpoint(v2.slice(3, 5), v3.slice(3, 5)));
    v31.push(...this.#midpoint(v3.slice(3, 5), v1.slice(3, 5)));

    // add new vertices
    const i12 = this.#addVertex(v12);
    const i23 = this.#addVertex(v23);
    const i31 = this.#addVertex(v31);

    n -= 1;
    this.#subdivide(n, i1, i12, i31, newIndices);
    this.#subdivide(n, i12, i2, i23, newIndices);
    this.#subdivide(n, i31, i23, i3, newIndices);
    this.#subdivide(n, i12, i23, i31, newIndices);
  }
  #midpoint(v1, v2) {
    return v1.map((val, i) => (val + v2[i]) / 2);
  }
  #normalize(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return v.map(val => val / length);
  }
  #addVertex(v) {
    this.vertices.push(...v);
    return (this.vertices.length / this.stride) - 1;
  }
}
