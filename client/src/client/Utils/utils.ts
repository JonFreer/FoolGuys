import * as THREE from "three";

export enum Space
{
	Local = 'local',
	Global = 'global'
}

export function getRight(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3
{
	const matrix = getMatrix(obj, space);
	return new THREE.Vector3(
		matrix.elements[0],
		matrix.elements[1],
		matrix.elements[2]
		);
}

export function getUp(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3
{
	const matrix = getMatrix(obj, space);
	return new THREE.Vector3(
		matrix.elements[4],
		matrix.elements[5],
		matrix.elements[6]
		);
}

export function getForward(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3
{
	const matrix = getMatrix(obj, space);
	return new THREE.Vector3(
		matrix.elements[8],
		matrix.elements[9],
		matrix.elements[10]
		);
}

export function getBack(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3
{
	const matrix = getMatrix(obj, space);
	return new THREE.Vector3(
		-matrix.elements[8],
		-matrix.elements[9],
		-matrix.elements[10]
		);
}

export function getMatrix(obj: THREE.Object3D, space: Space): THREE.Matrix4
{
	switch (space)
	{
		case Space.Local: return obj.matrix;
		case Space.Global: return obj.matrixWorld;
	}
}