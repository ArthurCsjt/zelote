import React, { useState } from 'react';
import { createChromebook } from '../../services/chromebookService';
import { QRCodeModal } from '../components/QRCodeModal';

const ChromebookRegistration = () => {
    const [formData, setFormData] = useState<any>({});
    const [newChromebookData, setNewChromebookData] = useState<any>(null);
    const [showQRCode, setShowQRCode] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = {
            name: (document.getElementById('name') as HTMLInputElement).value,
            email: (document.getElementById('email') as HTMLInputElement).value,
            phone: (document.getElementById('phone') as HTMLInputElement).value,
            address: (document.getElementById('address') as HTMLInputElement).value,
            city: (document.getElementById('city') as HTMLInputElement).value,
            state: (document.getElementById('state') as HTMLInputElement).value,
            zipCode: (document.getElementById('zipCode') as HTMLInputElement).value,
            country: (document.getElementById('country') as HTMLInputElement).value,
            gender: (document.getElementById('gender') as HTMLInputElement).value,
            birthDate: (document.getElementById('birthDate') as HTMLInputElement).value,
            height: (document.getElementById('height') as HTMLInputElement).value,
            weight: (document.getElementById('weight') as HTMLInputElement).value,
            description: (document.getElementById('description') as HTMLInputElement).value,
        };

        try {
            const createdData = await createChromebook(formData);
            setNewChromebookData(createdData);
            setShowQRCode(true);
        } catch (error) {
            console.error('Error creating Chromebook:', error);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" id="name" placeholder="Name" />
                <input type="email" id="email" placeholder="Email" />
                <input type="phone" id="phone" placeholder="Phone" />
                <input type="address" id="address" placeholder="Address" />
                <input type="city" id="city" placeholder="City" />
                <input type="state" id="state" placeholder="State" />
                <input type="zipCode" id="zipCode" placeholder="Zip Code" />
                <input type="country" id="country" placeholder="Country" />
                <input type="gender" id="gender" placeholder="Gender" />
                <input type="birthDate" id="birthDate" placeholder="Birth Date" />
                <input type="height" id="height" placeholder="Height" />
                <input type="weight" id="weight" placeholder="Weight" />
                <input type="description" id="description" placeholder="Description" />
                <button type="submit">Submit</button>
            </form>
            <QRCodeModal
                open={showQRCode}
                onClose={() => setShowQRCode(false)}
                chromebookId={newChromebookData?.chromebookId}
            />
        </div>
    );
};

export default ChromebookRegistration;