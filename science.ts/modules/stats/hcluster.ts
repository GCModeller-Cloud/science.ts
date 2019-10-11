namespace science.stats {

    export enum hclusterlinkages {
        single,
        complete,
        average
    }

    export class hclusterFunction {

        private m_distance = science.stats.distance.euclidean;
        public linkage: hclusterlinkages = hclusterlinkages.single; // single, complete or average

        hcluster(vectors) {
            var n = vectors.length,
                dMin = [],
                cSize = [],
                distMatrix = [],
                clusters = [],
                c1,
                c2,
                c1Cluster,
                c2Cluster,
                p,
                root,
                i,
                j;

            // Initialise distance matrix and vector of closest clusters.
            i = -1; while (++i < n) {
                dMin[i] = 0;
                distMatrix[i] = [];
                j = -1; while (++j < n) {
                    distMatrix[i][j] = i === j ? Infinity : this.m_distance(vectors[i], vectors[j]);
                    if (distMatrix[i][dMin[i]] > distMatrix[i][j]) dMin[i] = j;
                }
            }

            // create leaves of the tree
            i = -1; while (++i < n) {
                clusters[i] = [];
                clusters[i][0] = {
                    left: null,
                    right: null,
                    dist: 0,
                    centroid: vectors[i],
                    size: 1,
                    depth: 0
                };
                cSize[i] = 1;
            }

            // Main loop
            for (p = 0; p < n - 1; p++) {
                // find the closest pair of clusters
                c1 = 0;
                for (i = 0; i < n; i++) {
                    if (distMatrix[i][dMin[i]] < distMatrix[c1][dMin[c1]]) c1 = i;
                }
                c2 = dMin[c1];

                // create node to store cluster info 
                c1Cluster = clusters[c1][0];
                c2Cluster = clusters[c2][0];

                var newCluster = {
                    left: c1Cluster,
                    right: c2Cluster,
                    dist: distMatrix[c1][c2],
                    centroid: calculateCentroid(c1Cluster.size, c1Cluster.centroid,
                        c2Cluster.size, c2Cluster.centroid),
                    size: c1Cluster.size + c2Cluster.size,
                    depth: 1 + Math.max(c1Cluster.depth, c2Cluster.depth)
                };
                clusters[c1].splice(0, 0, newCluster);
                cSize[c1] += cSize[c2];

                // overwrite row c1 with respect to the linkage type
                for (j = 0; j < n; j++) {
                    switch (this.linkage) {
                        case hclusterlinkages.single:
                            if (distMatrix[c1][j] > distMatrix[c2][j])
                                distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                            break;
                        case hclusterlinkages.complete:
                            if (distMatrix[c1][j] < distMatrix[c2][j])
                                distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                            break;
                        case hclusterlinkages.average:
                            distMatrix[j][c1] = distMatrix[c1][j] = (cSize[c1] * distMatrix[c1][j] + cSize[c2] * distMatrix[c2][j]) / (cSize[c1] + cSize[j]);
                            break;
                    }
                }
                distMatrix[c1][c1] = Infinity;

                // infinity ­out old row c2 and column c2
                for (i = 0; i < n; i++)
                    distMatrix[i][c2] = distMatrix[c2][i] = Infinity;

                // update dmin and replace ones that previous pointed to c2 to point to c1
                for (j = 0; j < n; j++) {
                    if (dMin[j] == c2) dMin[j] = c1;
                    if (distMatrix[c1][j] < distMatrix[c1][dMin[c1]]) dMin[c1] = j;
                }

                // keep track of the last added cluster
                root = newCluster;
            }

            return root;
        }

        distance(x) {
            if (!arguments.length) return this.m_distance;
            this.m_distance = x;
            return this;
        };
    }
}