import { useState } from 'react';

const useForm = (initialValues: Record<string, any>, validate: (values: Record<string, any>) => Record<string, string>) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
        setErrors({
            ...errors,
            [name]: validate({ ...values, [name]: value })[name],
        });
    };

    const handleSubmit = (callback: () => void) => (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            callback();
        }
    };

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
    };
};

export default useForm;