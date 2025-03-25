// server/productServer.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load product.proto and discovery.proto
const PRODUCT_PROTO_PATH = path.join(__dirname, '../proto/product.proto');
const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');

const productProto = grpc.loadPackageDefinition(protoLoader.loadSync(PRODUCT_PROTO_PATH)).product;
const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

// In-memory "database" for products
let products = [];

// Create a gRPC client for the Discovery Service
const discoveryClient = new discoveryProto.DiscoveryService('localhost:50050', grpc.credentials.createInsecure());

// Register the Product Service with the Discovery Service
discoveryClient.registerService({ service_name: 'ProductService', address: 'localhost:50051' }, (err, response) => {
    if (err) {
        console.error('Error registering product service:', err);
    } else {
        console.log('Product Service registered with Discovery Service at:', response.address);
    }
});

// Implement GetProduct RPC
function getProduct(call, callback) {
    const product = products.find(p => p.id === call.request.id);
    if (product) {
        callback(null, product);
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: "Product not found"
        });
    }
}

// Implement InsertProduct RPC
function insertProduct(call, callback) {
    const newProduct = {
        id: products.length + 1,
        name: call.request.name,
        price: call.request.price
    };
    products.push(newProduct);
    callback(null, newProduct);
}

// Create the gRPC server for the ProductService
const server = new grpc.Server();
server.addService(productProto.ProductService.service, { getProduct, insertProduct });

// Start the ProductService server
const port = 'localhost:50051';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Product Service running at ${port}`);
    server.start();
});
