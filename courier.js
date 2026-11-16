(() => {
  const route = document.querySelector('#route');
  const art = route?.querySelector('.kr-courier');
  if (!art) return;

  const svg = art.querySelector('svg');
  const body = art.querySelector('[data-courier-body]');
  const exitGroup = art.querySelector('[data-courier-exit]');
  const parcel = art.querySelector('[data-courier-parcel]');
  const plane = art.querySelector('[data-courier-plane]');
  const flash = art.querySelector('[data-courier-flash]');
  const trail = art.querySelector('.kr-courier__trail');
  const props = new Map([...art.querySelectorAll('[data-courier-held]')].map(prop => [
    Number(prop.dataset.courierProp), prop,
  ]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function limb(side, x, y, hip) {
    return {
      x, y, hip,
      arm: art.querySelector(`[data-courier-arm="${side}"]`),
      elbow: art.querySelector(`[data-courier-elbow="${side}"]`),
      leg: art.querySelector(`[data-courier-leg="${side}"]`),
    };
  }

  const far = limb('far', 208, 79, 215);
  const near = limb('near', 238, 78, 229);
  // Shoulder and elbow angles, body lean and height, then the two feet.
  const poses = [
    { from: [-43, -38, -28, -48, 2, 0, 6, -6], to: [-58, -40, -38, -75, 6, 0, 6, -6] },
    { from: [-67, -14, -35, -36, 3, 1, 2, -7], to: [-78, -13, -61, -45, 8, 2, 3, -7] },
    { from: [-44, -27, -17, -64, 9, 5, 12, -13], to: [-70, -10, -35, -64, -5, -5, 3, -7] },
    { from: [-65, -22, -63, -38, -3, 1, 4, -5], to: [-105, -14, -120, -12, 2, -4, 3, -5] },
    { from: [-38, -31, -102, -23, -9, 1, 18, -16], to: [-61, -20, -142, 10, 11, -6, -6, 10] },
    { from: [-58, -22, -32, -53, -4, -3, 7, -5], to: [-74, -17, -41, -64, 8, 4, 5, -6] },
    { from: [-28, -38, -105, -30, 4, 0, 4, -7], to: [-24, -38, -159, -10, -6, -1, 5, -6] },
    { from: [-20, -31, -20, -30, -4, 0, 4, -7], to: [-96, -15, -43, -62, 4, 1, 5, -8] },
  ];

  let latest = { step: 0, progress: 1, exit: 0 };
  let viewWidth = 440;
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, ratio) => a + (b - a) * ratio;
  const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const degrees = Math.PI / 180;

  function moveArm(side, shoulderAngle, elbowAngle) {
    side.arm.setAttribute('transform', `translate(${side.x} ${side.y}) rotate(${shoulderAngle})`);
    side.elbow.setAttribute('transform', `translate(0 17) rotate(${elbowAngle})`);
    const shoulder = shoulderAngle * degrees;
    const forearm = (shoulderAngle + elbowAngle) * degrees;
    return {
      x: side.x - 17 * Math.sin(shoulder) - 20 * Math.sin(forearm),
      y: side.y + 17 * Math.cos(shoulder) + 20 * Math.cos(forearm),
    };
  }

  function draw({ step, progress, exit }) {
    if (reducedMotion.matches) {
      progress = 1;
      exit = 0;
    }

    art.dataset.step = String(step);
    const pose = poses[step];
    const t = smooth(step === 7 ? (progress - .06) / .54 : progress);
    const [farAngle, farElbow, nearAngle, nearElbow, tilt, height, farFoot, nearFoot] =
      pose.from.map((from, index) => mix(from, pose.to[index], t));

    const dip = step === 7 ? Math.sin(smooth((progress - .61) / .32) * Math.PI) * 8 : 0;
    const leave = step === 7 ? exit : 0;
    const offset = Math.pow(leave, 1.2);
    const turn = tilt - leave * 15;
    body.setAttribute('transform', `translate(0 ${height + dip}) rotate(${turn} 223 115)`);
    exitGroup.setAttribute('transform', `translate(${leave * 16} ${offset * 182})`);
    exitGroup.setAttribute('opacity', String(1 - smooth((leave - .7) / .3)));
    far.leg.setAttribute('transform', `rotate(${farFoot + leave * 25} ${far.hip} 121)`);
    near.leg.setAttribute('transform', `rotate(${nearFoot - leave * 19} ${near.hip} 121)`);
    const leftHand = moveArm(far, farAngle, farElbow);
    const rightHand = moveArm(near, nearAngle, nearElbow);
    const holdX = mix(leftHand.x, rightHand.x, .5);
    const holdY = mix(leftHand.y, rightHand.y, .5);

    if (props.has(step)) {
      const held = props.get(step);
      if (step < 2) {
        held.setAttribute('transform', `translate(${leftHand.x + 6} ${leftHand.y - 2}) rotate(${step ? -13 : 9})`);
      } else if (step === 6) {
        held.setAttribute('transform', `translate(${rightHand.x + 1} ${rightHand.y}) rotate(-10)`);
      } else {
        held.setAttribute('transform', `translate(${holdX + 3} ${holdY - 7})`);
      }
    }
    if (step === 3) {
      const exposure = clamp(1 - Math.abs(progress - .69) * 5);
      flash.setAttribute('opacity', String(.38 + exposure * .62));
    }
    if (step === 4) {
      const flightY = 61 - Math.sin(progress * Math.PI / 2) * 39;
      plane.setAttribute('transform', `translate(${mix(132, 315, progress)} ${flightY}) rotate(-9)`);
    }
    if (step === 7) {
      const drop = Math.pow(clamp((progress - .035) / .62), 1.9);
      const parcelY = mix(-27, holdY - 9, drop);
      parcel.setAttribute('transform', `translate(${holdX + 5} ${parcelY}) rotate(${-21 * (1 - drop)})`);
      trail.setAttribute('opacity', String(.21 + Math.max(1 - drop, leave) * .71));
    }
  }

  function fitArtwork() {
    const { clientWidth, clientHeight } = art;
    if (!clientWidth || !clientHeight) return;
    const nextWidth = Math.min(440, Math.max(217, Math.round(clientWidth / clientHeight * 190)));
    if (nextWidth === viewWidth) return;
    viewWidth = nextWidth;
    svg.setAttribute('viewBox', `${(440 - viewWidth) / 2} 0 ${viewWidth} 190`);
  }

  route.addEventListener('kryvo:journey', ({ detail }) => {
    if (!Number.isInteger(detail?.step) || !poses[detail.step]) return;
    latest = { step: detail.step, progress: clamp(detail.progress ?? 0), exit: clamp(detail.exit ?? 0) };
    draw(latest);
  });
  reducedMotion.addEventListener('change', () => draw(latest));
  if ('ResizeObserver' in window) new ResizeObserver(fitArtwork).observe(art);
  else window.addEventListener('resize', fitArtwork, { passive: true });
  fitArtwork();
  draw(latest);
})();
