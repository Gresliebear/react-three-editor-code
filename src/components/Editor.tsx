import React, { useRef, useState } from 'react';
import { Canvas } from 'react-three-fiber';
import { useEditorStore } from '../store';
import { OrbitControls } from '@react-three/drei';
import shallow from 'zustand/shallow';
import { Vector3 } from 'three';
import { saveAs } from 'file-saver';
import Proxy from './Proxy';

const EditorScene = () => {
  const orbitControlsRef = useRef<OrbitControls>();

  const [
    staticSceneProxy,
    editables,
    selected,
    setSelected,
    set,
  ] = useEditorStore(
    (state) => [
      state.staticSceneProxy,
      state.editables,
      state.selected,
      state.setSelected,
      state.set,
    ],
    shallow
  );

  return (
    <>
      <primitive object={staticSceneProxy}></primitive>

      <directionalLight position={[10, 20, 15]} />
      <gridHelper args={[30, 30, 30]} />
      <axesHelper />
      <OrbitControls ref={orbitControlsRef} />

      {Object.entries(editables).map(
        ([name, editable]) =>
          editable.type !== 'nil' && (
            <Proxy
              selected={selected === name}
              orbitControlsRef={orbitControlsRef}
              proxyObject={editable.proxy}
              onClick={() => setSelected(name)}
              onChange={() => {
                set((state) => {
                  const newPosition = new Vector3();
                  newPosition
                    .subVectors(
                      editable.proxy.position,
                      editable.codeTransform.position
                    )
                    .sub(editable.original.parent!.position);

                  state.editables[name].editorTransform.position = newPosition;
                });
              }}
              key={name}
            />
          )
      )}
    </>
  );
};

const Editor = () => {
  const [open, setOpen] = useState(false);
  const [scene, editables] = useEditorStore((state) => [
    state.scene,
    state.editables,
  ]);

  return open ? (
    <>
      <div
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          cursor: 'pointer',
        }}
      >
        {scene ? (
          <Canvas
            colorManagement
            camera={{ position: [5, 5, 5] }}
            onCreated={({ gl }) => {
              gl.setClearColor('white');
            }}
            shadowMap
          >
            <EditorScene />
          </Canvas>
        ) : (
          <div>Editor hasn't been attached.</div>
        )}
      </div>
      <div
        style={{
          position: 'fixed',
          zIndex: 1001,
        }}
      >
        <button onClick={() => setOpen(false)}>Close</button>
        <button
          onClick={() => {
            const blob = new Blob(
              [
                JSON.stringify(
                  {
                    editables: Object.fromEntries(
                      Object.entries(editables).map(([name, editable]) => [
                        name,
                        {
                          transform: editable.editorTransform.toObject(),
                        },
                      ])
                    ),
                  },
                  null,
                  2
                ),
              ],
              { type: 'text/json;charset=utf-8' }
            );
            saveAs(blob, 'editableState.json');
          }}
        >
          Export
        </button>
      </div>
    </>
  ) : (
    <button
      style={{
        position: 'fixed',
        zIndex: 1000,
      }}
      onClick={() => setOpen(true)}
    >
      Editor
    </button>
  );
};

export default Editor;
