import React, { useEffect, useRef } from "react";
import { Application, Graphics } from "pixi.js";
import * as d3 from "d3-force";

const Graph = ({ width = 800, height = 600 }) => {
    const pixiContainer = useRef(null);
    const appRef = useRef(null);
    const simulationRef = useRef(null);
    const nodesRef = useRef([]);
    const linksRef = useRef([]);
    const graphicsRef = useRef(null); // For drawing links

    useEffect(() => {
        const initializePixi = async () => {
            if (!pixiContainer.current) return;

            // Ensure PIXI application is only created once
            if (appRef.current) return;

            try {
                // Initialize PIXI application
                const app = new Application();
                await app.init({ width, height, antialias: true, backgroundColor: 0x282c34 });

                if (!app.view) {
                    throw new Error("PIXI application view is not initialized.");
                }

                pixiContainer.current.appendChild(app.view);
                appRef.current = app;

                console.log("✅ PIXI App Initialized");

                // Create a container for link graphics
                const graphics = new Graphics();
                app.stage.addChild(graphics);
                graphicsRef.current = graphics;

                // Generate sample nodes
                const nodes = Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    x: Math.random() * width,
                    y: Math.random() * height,
                    linkCount: 0 // Initialize link count
                }));

                console.log("✅ Nodes Created:", nodes);

                // Generate sample links
                const links = Array.from({ length: 30 }, () => {
                    const source = nodes[Math.floor(Math.random() * nodes.length)];
                    const target = nodes[Math.floor(Math.random() * nodes.length)];
                    if (source !== target) {
                        source.linkCount++;
                        target.linkCount++;
                    }
                    return { source, target };
                }).filter(l => l.source !== l.target);

                console.log("✅ Links Created:", links);

                // Initialize D3 Force Simulation
                const simulation = d3.forceSimulation(nodes)
                    .force("charge", d3.forceManyBody().strength(-40))
                    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .on("tick", updatePositions);

                simulationRef.current = simulation;
                nodesRef.current = nodes;
                linksRef.current = links;

                // Draw links
                graphics.beginFill(0x000000, 0);
                graphics.lineStyle(2, 0xffffff, 0.6);
                links.forEach(link => {
                    if (link.source && link.target) {
                        graphics.moveTo(link.source.x, link.source.y);
                        graphics.lineTo(link.target.x, link.target.y);
                    }
                });
                graphics.endFill();

                // Create interactive nodes using PIXI.Graphics (Circles)
                nodes.forEach(node => {
                    const circle = new Graphics();
                    drawNode(circle, node.x, node.y, node.linkCount);

                    // Enable interaction
                    circle.eventMode = "static";
                    circle.cursor = "pointer";
                    circle.node = node;

                    // Enable drag and drop
                    circle.on("pointerdown", onDragStart, circle);
                    app.stage.addChild(circle);
                    node.circle = circle;
                });

                console.log("✅ Nodes (Circles) Added to Stage");

                // Dragging logic
                let dragTarget = null;

                function onDragMove(event) {
                    if (dragTarget) {
                        dragTarget.node.fx = event.global.x;
                        dragTarget.node.fy = event.global.y;
                        simulation.alpha(1).restart();
                    }
                }

                function onDragStart(event) {
                    this.alpha = 0.5;
                    dragTarget = this;
                    dragTarget.node.fx = event.global.x;
                    dragTarget.node.fy = event.global.y;
                    app.stage.on("pointermove", onDragMove);
                }

                function onDragEnd() {
                    if (dragTarget) {
                        app.stage.off("pointermove", onDragMove);
                        dragTarget.alpha = 1;
                        dragTarget.node.fx = null;
                        dragTarget.node.fy = null;
                        dragTarget = null;
                        simulation.alphaTarget(0);
                    }
                }

                app.stage.eventMode = "static";
                app.stage.hitArea = app.screen;
                app.stage.on("pointerup", onDragEnd);
                app.stage.on("pointerupoutside", onDragEnd);

                function updatePositions() {
                    // Clear graphics before redrawing
                    graphicsRef.current.clear();

                    // Draw links first so nodes appear on top
                    graphicsRef.current.beginFill(0x000000, 0);
                    graphicsRef.current.lineStyle(2, 0xffffff, 0.6);
                    linksRef.current.forEach(link => {
                        if (link.source && link.target) {
                            graphicsRef.current.moveTo(link.source.x, link.source.y);
                            graphicsRef.current.lineTo(link.target.x, link.target.y);
                        }
                    });
                    graphicsRef.current.endFill();

                    // Then update node positions
                    nodesRef.current.forEach(node => {
                        if (node.circle) {
                            node.circle.clear();
                            drawNode(node.circle, node.x, node.y, node.linkCount);
                        }
                    });
                }

                function drawNode(graphic, x, y, linkCount) {
                    const radius = 4 + linkCount*2; // Increase radius based on link count
                    graphic.clear();
                    graphic.beginFill(0x66ccff);
                    graphic.drawCircle(x, y, radius);
                    graphic.endFill();
                }

                return () => {
                    simulation.stop();
                    app.destroy(true, true);
                    appRef.current = null;
                    simulationRef.current = null;
                    nodesRef.current = [];
                    linksRef.current = [];
                };
            } catch (error) {
                console.error("Error initializing PIXI application:", error);
            }
        };

        window.addEventListener("load", initializePixi);

        return () => {
            window.removeEventListener("load", initializePixi);
        };
    }, [width, height]);

    return <div ref={pixiContainer} style={{ width, height }} />;
};

export default Graph;
