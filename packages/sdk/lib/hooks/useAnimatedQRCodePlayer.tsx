import React, { useEffect, useMemo, useState } from 'react';
import { interval } from 'rxjs';
import { BaseQRCode } from '../components/BaseQRCode';
import { Play } from '../types';
import { EventEmitter } from 'events';
import { Button } from '../components/Button';
import { ButtonGroup } from '../components/ButtonGroup';
import { UR, UREncoder } from '@ngraveio/bc-ur';

const DEFAULT_SPEED = 100;

export const useAnimatedQRCodePlayer = (): [JSX.Element, { play: Play }] => {
    const [data, setData] = useState<UR>(new UR(Buffer.from('NO DATA', 'utf-8')));

    const [refreshSpeed, setRefreshSpeed] = useState(DEFAULT_SPEED);
    const [hasNext, setHasNext] = useState(false);
    const [title, setTitle] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);

    const urEncoder = useMemo(() => new UREncoder(data), [data]);

    const [qr, setQR] = useState<string>(urEncoder.nextPart());

    const ee = useMemo(() => new EventEmitter(), []);
    const reset = () => {
        setData(new UR(Buffer.from('')));
        setRefreshSpeed(DEFAULT_SPEED);
    };

    useEffect(() => {
        const subscribe = interval(refreshSpeed).subscribe(() => {
            setQR(urEncoder.nextPart());
        });
        return () => {
            subscribe.unsubscribe();
        };
    }, [refreshSpeed, urEncoder]);

    const finish = () => {
        ee.emit('finish', true);
    };

    const element = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {title && <p>{title}</p>}
            {description && <p>{description}</p>}
            <BaseQRCode size={288} data={qr} />
            <ButtonGroup>
                <Button onClick={finish}>{hasNext ? 'Continue' : 'Finish'}</Button>
            </ButtonGroup>
        </div>
    );

    return [
        element,
        {
            play: (data, options) => {
                return new Promise((resolve) => {
                    setData(data);
                    if (options) {
                        options.refreshSpeed && setRefreshSpeed(options.refreshSpeed);
                        options.hasNext && setHasNext(options.hasNext);
                        options.title && setTitle(options.title);
                        options.description && setDescription(options.description);
                    }
                    ee.once('finish', () => {
                        reset();
                        resolve();
                    });
                });
            },
        },
    ];
};
