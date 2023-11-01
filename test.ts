import fetch, { FetchResultTypes } from "@sapphire/fetch";
import { createCanvas, Canvas } from 'canvas';
import fs from 'fs';

class MindMapNode {
  branches: MindMapNode[] = [];
  constructor(public x: number, public y: number, public text: string, public backgroundColor?: string) { }
}

class Header {
  constructor(public text: string) { }
}

interface ConfigNode {
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Config {
  header: string;
  centralNode: {
    x: number;
    y: number;
    text: string;
  };
  nodes: ConfigNode[];
  branches?: any[]
};

export class MindMap {
  private centralNode: MindMapNode | null = null;
  private nodes: MindMapNode[] = [];
  private header: Header | null = null;
  branches: { branchName: string; nodes: MindMapNode[] }[] = [];


  public addCentralNode(centralNode: MindMapNode) {
    this.centralNode = centralNode;
  }

  public addNode(node: MindMapNode) {
    this.nodes.push(node);
  }

  public setHeader(header: Header) {
    this.header = header;
  }

  public addBranch(branchName: string, nodes: MindMapNode[]) {
    const branch = { branchName, nodes };
    this.branches.push(branch);
  }

  public setConfig(config: Config) {
    this.centralNode = null;
    this.nodes = [];
    this.header = null;
    this.branches = [];

    this.addCentralNode(
      new MindMapNode(
        config.centralNode.x,
        config.centralNode.y,
        config.centralNode.text,
        "white"
      )
    );

    for (const nodeConfig of config.nodes) {
      this.addNode(
        new MindMapNode(
          nodeConfig.x,
          nodeConfig.y,
          nodeConfig.text,
          nodeConfig.color
        )
      );
    }

    this.setHeader(new Header(config.header));

    this.calculateBranchNodePositions();
  }

  private calculateBranchNodePositions(): void {
    console.log(this)
    const numBranches = this.branches.length;
    const centerX = this.centralNode?.x || 0;
    const centerY = this.centralNode?.y || 0;
    const branchRadius = 200;
    const angleSpacing = (Math.PI * 2) / numBranches;

    for (let i = 0; i < numBranches; i++) {
      const angle = i * angleSpacing;
      const nodeX = centerX + branchRadius * Math.cos(angle);
      const nodeY = centerY + branchRadius * Math.sin(angle);

      this.branches[i].nodes[0].x = nodeX;
      this.branches[i].nodes[0].y = nodeY;
    }
  }

  public generateImage():Buffer {
    const numNodes = this.nodes.length;
    const radius = 200 + (Math.ceil(numNodes / 12) - 1) * 100; 
    const canvasWidth = 2 * (radius + 100); 
    const canvasHeight = 2 * (radius + 100); 
  
    const canvas: Canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
  
    ctx.fillStyle = '#403f3b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    if (this.centralNode) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = 'black';
      const textWidth = ctx.measureText(this.centralNode.text).width;
      ctx.fillText(
        this.centralNode.text,
        this.centralNode.x - textWidth / 2,
        this.centralNode.y + 8
      );
  
      const numNodes = this.nodes.length;
      let radius = 200;
      const centerX = this.centralNode.x;
      const centerY = this.centralNode.y;
  
      if (numNodes >= 12) {
        const numSets = Math.ceil(numNodes / 12);
        const angleSpacing = (Math.PI * 2) / numSets;
  
        for (let set = 0; set < numSets; set++) {
          const nodesInSet = Math.min(12, numNodes - set * 12); 
          const setRadius = radius + (set * 110); 
  
          const angleOffset = set === 0 ? 0 : (Math.PI / nodesInSet);
  
          for (let i = 0; i < nodesInSet; i++) {
            const angle = (angleSpacing * set) + (angleOffset) + (Math.PI * 2 * i) / nodesInSet;

            const nodeX = centerX + setRadius * Math.cos(angle);
            const nodeY = centerY + setRadius * Math.sin(angle);
  
            this.nodes[set * 12 + i].x = nodeX;
            this.nodes[set * 12 + i].y = nodeY;
          }
        }
      } else {
        for (let i = 0; i < numNodes; i++) {
          const angle = (Math.PI * 2 * i) / numNodes;
          const nodeX = centerX + radius * Math.cos(angle);
          const nodeY = centerY + radius * Math.sin(angle);
  
          this.nodes[i].x = nodeX;
          this.nodes[i].y = nodeY;
        }
      }
  
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
  
      this.nodes.forEach((node) => {
        ctx.beginPath();
        ctx.moveTo(
          this.centralNode!.x + (60 * Math.cos(Math.atan2(node.y - centerY, node.x - centerX))),
          this.centralNode!.y + (60 * Math.sin(Math.atan2(node.y - centerY, node.x - centerX)))
        );
        ctx.lineTo(
          node.x - (50 * Math.cos(Math.atan2(node.y - centerY, node.x - centerX))),
          node.y - (50 * Math.sin(Math.atan2(node.y - centerY, node.x - centerX)))
        );
        ctx.stroke();
        ctx.closePath();
  
        ctx.fillStyle = node.backgroundColor ?? 'white';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      });
  
      ctx.beginPath();
      ctx.arc(this.centralNode.x, this.centralNode.y, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
  
      ctx.font = '18px sans-serif';
      ctx.fillStyle = 'black';
      const textWidthh = ctx.measureText(this.centralNode.text).width;
      ctx.fillText(
        this.centralNode.text,
        this.centralNode.x - textWidthh / 2,
        this.centralNode.y + 8
      );
    }
  
    if (this.header) {
      ctx.font = '24px sans-serif';
      const textWidth = ctx.measureText(this.header.text).width;
      ctx.fillStyle = 'black';
      ctx.fillText(this.header.text, (canvas.width - textWidth) / 2, 50);
    }
  
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
  
    this.nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();
  
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'black';
      const textWidth = ctx.measureText(node.text).width;
      ctx.fillText(node.text, node.x - textWidth / 2, node.y + 8);
    });
  
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    const generatedText = 'Generated with mindmap-bot';
    const generatedTextWidth = ctx.measureText(generatedText).width;
    ctx.fillText(
      generatedText,
      canvas.width - generatedTextWidth - 10,
      canvas.height - 10
    );
  
    return canvas.toBuffer();
  };

  getDistance(node1: any, node2: any) {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  isPowerOf12(num: number): any {
    if (num === 1) {
      return true;
    }
    if (num < 1 || num % 12 !== 0) {
      return false;
    }
    return this.isPowerOf12(num / 12);
  };
};

const mindMap = new MindMap();
/*
const branchNodes: MindMapNode[] = [
  new MindMapNode(100, 200, 'Node A'),
  new MindMapNode(300, 200, 'Node B'),
];
console.log(branchNodes)
*/


const config: Config = {
  header: 'Mindmap bot test code',
  centralNode: {
    x: 400,
    y: 400,
    text: 'hi',
  },
  nodes: [],
  branches: [{
    x: 0,
    y: 0,
    text: 'Node A',
    backgroundColor: "white",
  },
  {
    x: 0,
    y: 0,
    text: 'Node B',
    backgroundColor: "white",
  }
  ]
};

for (let i = 1; i <= 10; i++) {
  config.nodes.push({
    x: 0,
    y: 0,
    text: `Node ${i}`,
    color: 'green',
  });
}

mindMap.setConfig(config);
//mindMap.addBranch('Branch 1', branchNodes);
const imageBuffer: Buffer = mindMap.generateImage();
fs.writeFileSync('mindmap.png', imageBuffer);