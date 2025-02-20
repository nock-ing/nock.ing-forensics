import { ReactFlow, Controls, Background } from '@xyflow/react';


import "@xyflow/react/dist/style.css";

const nodes = [
  {
    id: '1', // required
    position: { x: 0, y: 0 }, // required
    data: { label: 'Hello' }, // required
  },
];

export default function WalletFlow() {

    return (
        <div style={{ height: '100%' }}>
            <ReactFlow nodes={nodes}>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}