// server/discoveryServer.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load discovery.proto
const DISCOVERY_PROTO_PATH = path.join(__dirname, '../proto/discovery.proto');
const discoveryProto = grpc.loadPackageDefinition(protoLoader.loadSync(DISCOVERY_PROTO_PATH)).discovery;

// In-memory service registry
let services = {};

// Register a service
function registerService(call, callback) {
    const { service_name, address } = call.request;
    services[service_name] = address;
    console.log(`Registered service: ${service_name} at ${address}`);
    callback(null, { address });
}

// Discover a service by name
function discoverService(call, callback) {
    const { service_name } = call.request;
    const address = services[service_name];
    if (address) {
        callback(null, { address });
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: `Service ${service_name} not found`
        });
    }
}

// Create the gRPC server and add the DiscoveryService
const server = new grpc.Server();
server.addService(discoveryProto.DiscoveryService.service, { registerService, discoverService });

// Start the server
const port = 'localhost:50050';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Discovery Service running at ${port}`);
    server.start();
});
